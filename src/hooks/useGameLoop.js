/**
 * Core game state machine for Nikusokuda
 * Manages: question flow, timing, scoring, combo, and game lifecycle
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { generateQuestions } from '../utils/questionGen';
import { calcScore, getGrade, getComboDisplay, GRADES } from '../utils/score';
import {
  saveBestTime, saveBestSales, addTotalSales,
  unlockMeats, isSecretUnlocked, unlockSecret,
  getAutoReset, getRankFromSales, getTotalSales,
} from '../utils/storage';
import LEVELS from '../data/levels';

const QUESTION_TIME_LIMIT = 5000; // ms per question
const TOTAL_TIME_LIMIT = 100000;  // 100s total (default)
const QUESTIONS_PER_GAME = 20;

export const GAME_STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  PLAYING: 'playing',
  QUESTION_END: 'question_end',
  GAME_OVER: 'game_over',
};

export function useGameLoop(levelId, { challenge100 = false } = {}) {
  const level = LEVELS[levelId];

  // State
  const [status, setStatus] = useState(GAME_STATUS.IDLE);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // {correct, timeMs, grade, earned}
  const [totalSales, setTotalSales] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastGrade, setLastGrade] = useState(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [globalElapsed, setGlobalElapsed] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const [secretJustUnlocked, setSecretJustUnlocked] = useState(false);
  const [rankUpInfo, setRankUpInfo] = useState(null);
  const [allCorrectUnder2s, setAllCorrectUnder2s] = useState(true);

  // Refs for timers
  const questionTimerRef = useRef(null);
  const globalTimerRef = useRef(null);
  const questionStartRef = useRef(null);
  const globalStartRef = useRef(null);
  const comboRef = useRef(0);
  const allUnder2sRef = useRef(true);
  const answersRef = useRef([]);
  const totalSalesRef = useRef(0);
  const currentIdxRef = useRef(0);
  const statusRef = useRef(GAME_STATUS.IDLE);

  const clearTimers = useCallback(() => {
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    questionTimerRef.current = null;
    globalTimerRef.current = null;
  }, []);

  const finishGame = useCallback((answersArray, elapsed) => {
    clearTimers();
    statusRef.current = GAME_STATUS.GAME_OVER;
    setStatus(GAME_STATUS.GAME_OVER);

    const correct = answersArray.filter(a => a.correct).length;
    const accuracy = Math.round((correct / QUESTIONS_PER_GAME) * 100);
    const finalSales = answersArray.reduce((sum, a) => sum + (a.earned || 0), 0);
    const isPerfect = correct === QUESTIONS_PER_GAME;
    const totalElapsed = elapsed;

    // Save records
    if (isPerfect) {
      saveBestTime(levelId, totalElapsed);
    }
    saveBestSales(levelId, finalSales);

    // Update cumulative sales and check rank
    const prevTotal = getTotalSales();
    const prevRank = getRankFromSales(prevTotal);
    const newTotal = addTotalSales(finalSales);
    const newRank = getRankFromSales(newTotal);

    let rankUp = null;
    if (newRank.min > prevRank.min) {
      rankUp = newRank;
    }

    // Unlock meats for levels played
    const levelMeats = level.meats || [];
    const newUnlocked = unlockMeats(levelMeats);
    setNewlyUnlocked(newUnlocked);

    // Check secret stage unlock: level 5, all correct, time < 100s
    let secretUnlocked = false;
    if (levelId === 5 && isPerfect && totalElapsed < 100000 && !isSecretUnlocked()) {
      unlockSecret();
      secretUnlocked = true;
      setSecretJustUnlocked(true);
    }

    if (rankUp) {
      setRankUpInfo(rankUp);
    }

    setGameResult({
      correct,
      accuracy,
      finalSales,
      totalElapsed,
      isPerfect,
      answers: answersArray,
      secretUnlocked,
      rankUp,
    });
  }, [levelId, level, clearTimers]);

  const handleBurnt = useCallback(() => {
    if (statusRef.current !== GAME_STATUS.PLAYING) return;

    const timeMs = QUESTION_TIME_LIMIT;
    const autoReset = getAutoReset() || (levelId === 'secret');

    setLastGrade(GRADES.BURNT);

    const newAnswer = {
      correct: false,
      timeMs,
      grade: GRADES.BURNT,
      earned: 0,
      burnt: true,
    };

    answersRef.current = [...answersRef.current, newAnswer];
    setAnswers([...answersRef.current]);
    comboRef.current = 0;
    setCombo(0);
    allUnder2sRef.current = false;
    setAllCorrectUnder2s(false);

    if (autoReset) {
      // End game immediately
      const elapsed = Date.now() - globalStartRef.current;
      finishGame(answersRef.current, elapsed);
      return;
    }

    // Move to next question or end
    const nextIdx = currentIdxRef.current + 1;
    if (nextIdx >= QUESTIONS_PER_GAME) {
      const elapsed = Date.now() - globalStartRef.current;
      finishGame(answersRef.current, elapsed);
    } else {
      currentIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
      startQuestionTimer();
    }
  }, [levelId, finishGame]);

  const startQuestionTimer = useCallback(() => {
    // 100秒チャレンジモード：問題ごとの制限時間なし
    if (challenge100) {
      questionStartRef.current = Date.now();
      setQuestionTimeLeft(QUESTION_TIME_LIMIT);
      return;
    }

    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    questionStartRef.current = Date.now();
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);

    const TICK = 50;
    questionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - questionStartRef.current;
      const remaining = Math.max(0, QUESTION_TIME_LIMIT - elapsed);
      setQuestionTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
        handleBurnt();
      }
    }, TICK);
  }, [handleBurnt, challenge100]);

  const startGlobalTimer = useCallback(() => {
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);

    globalStartRef.current = Date.now();
    setGlobalElapsed(0);

    const timeLimit = level.timeLimit ? level.timeLimit * 1000 : TOTAL_TIME_LIMIT;
    const TICK = 100;

    globalTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - globalStartRef.current;
      setGlobalElapsed(elapsed);

      if (elapsed >= timeLimit) {
        clearInterval(globalTimerRef.current);
        globalTimerRef.current = null;
        if (statusRef.current === GAME_STATUS.PLAYING) {
          finishGame(answersRef.current, elapsed);
        }
      }
    }, TICK);
  }, [level, finishGame]);

  // Start the game
  const startGame = useCallback(() => {
    clearTimers();

    const negativeRate = level.negativeRate ?? 0.3;
    const carryRate = level.carryRate ?? 0.9;
    const qs = generateQuestions(level.types, negativeRate, carryRate);

    answersRef.current = [];
    comboRef.current = 0;
    allUnder2sRef.current = true;
    totalSalesRef.current = 0;
    currentIdxRef.current = 0;

    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setTotalSales(0);
    setCombo(0);
    setMaxCombo(0);
    setLastGrade(null);
    setGlobalElapsed(0);
    setGameResult(null);
    setNewlyUnlocked([]);
    setSecretJustUnlocked(false);
    setRankUpInfo(null);
    setAllCorrectUnder2s(true);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);

    statusRef.current = GAME_STATUS.PLAYING;
    setStatus(GAME_STATUS.PLAYING);

    // Start timers
    setTimeout(() => {
      startGlobalTimer();
      startQuestionTimer();
    }, 0);
  }, [level, clearTimers, startGlobalTimer, startQuestionTimer]);

  // Submit an answer
  const submitAnswer = useCallback((inputStr) => {
    if (statusRef.current !== GAME_STATUS.PLAYING) return;

    const question = questions[currentIdxRef.current];
    if (!question) return;

    const timeMs = Date.now() - questionStartRef.current;
    const parsedInput = parseInt(inputStr, 10);
    const isCorrect = !isNaN(parsedInput) && parsedInput === question.answer;

    const grade = isCorrect ? getGrade(timeMs) : GRADES.BURNT;

    let newCombo = comboRef.current;
    let newAllUnder2s = allUnder2sRef.current;

    if (isCorrect) {
      newCombo += 1;
      if (timeMs > 2000) newAllUnder2s = false;
    } else {
      newCombo = 0;
      newAllUnder2s = false;
    }

    comboRef.current = newCombo;
    allUnder2sRef.current = newAllUnder2s;
    setCombo(newCombo);
    setAllCorrectUnder2s(newAllUnder2s);
    setMaxCombo(prev => Math.max(prev, newCombo));

    const { earned, speedBonus, comboBonus } = isCorrect
      ? calcScore(timeMs, level.price, newCombo, newAllUnder2s)
      : { earned: 0, speedBonus: 0, comboBonus: 0 };

    totalSalesRef.current += earned;
    setTotalSales(totalSalesRef.current);

    const newAnswer = {
      correct: isCorrect,
      timeMs,
      grade,
      earned,
      speedBonus,
      comboBonus,
      question,
      input: inputStr,
    };

    answersRef.current = [...answersRef.current, newAnswer];
    setAnswers([...answersRef.current]);
    setLastGrade({ grade, timeMs, isCorrect });

    // Clear question timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    // Auto-reset on wrong answer
    const autoReset = getAutoReset() || (levelId === 'secret');
    if (!isCorrect && autoReset) {
      const elapsed = Date.now() - globalStartRef.current;
      finishGame(answersRef.current, elapsed);
      return;
    }

    const nextIdx = currentIdxRef.current + 1;
    if (nextIdx >= QUESTIONS_PER_GAME) {
      const elapsed = Date.now() - globalStartRef.current;
      finishGame(answersRef.current, elapsed);
    } else {
      currentIdxRef.current = nextIdx;
      setCurrentIdx(nextIdx);
      startQuestionTimer();
    }
  }, [questions, level, levelId, finishGame, startQuestionTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const currentQuestion = questions[currentIdx] || null;
  const comboDisplay = getComboDisplay(combo);
  const timeRatio = questionTimeLeft / QUESTION_TIME_LIMIT;

  return {
    status,
    currentQuestion,
    currentIdx,
    totalQuestions: QUESTIONS_PER_GAME,
    answers,
    totalSales,
    combo,
    maxCombo,
    comboDisplay,
    lastGrade,
    questionTimeLeft,
    timeRatio,
    globalElapsed,
    gameResult,
    newlyUnlocked,
    secretJustUnlocked,
    rankUpInfo,
    allCorrectUnder2s,
    level,
    startGame,
    submitAnswer,
    abortGame: clearTimers,
  };
}

export default useGameLoop;
