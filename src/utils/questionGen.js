/**
 * Question Generator for Nikusokuda
 * Generates 20 unique math questions per level
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasCarry(a, b) {
  return (a % 10) + (b % 10) >= 10;
}

function hasBorrow(a, b) {
  return (a % 10) < (b % 10);
}

function parseType(type) {
  // e.g. "2+1" => { aDigits: 2, op: '+', bDigits: 1 }
  const match = type.match(/^(\d)([+-])(\d)$/);
  if (!match) throw new Error(`Invalid type: ${type}`);
  return {
    aDigits: parseInt(match[1]),
    op: match[2],
    bDigits: parseInt(match[3]),
  };
}

function genNum(digits) {
  if (digits === 1) return randInt(1, 9);
  if (digits === 2) return randInt(10, 99);
  throw new Error(`Unsupported digits: ${digits}`);
}

function generateOne(type, negativeRate = 0.3, carryRate = 0.9) {
  const { aDigits, op, bDigits } = parseType(type);
  const maxAttempts = 200;

  for (let i = 0; i < maxAttempts; i++) {
    let a = genNum(aDigits);
    let b = genNum(bDigits);

    if (op === '+') {
      // 90% carry rate for addition
      const needCarry = Math.random() < carryRate;
      if (needCarry && !hasCarry(a, b)) {
        // Force carry: adjust ones digits
        const aOnes = randInt(1, 9);
        const bOnes = randInt(Math.max(1, 10 - aOnes), 9);
        a = (aDigits === 2) ? (Math.floor(a / 10) * 10 + aOnes) : aOnes;
        b = (bDigits === 2) ? (Math.floor(b / 10) * 10 + bOnes) : bOnes;
        if (aDigits === 1) a = aOnes;
        if (bDigits === 1) b = bOnes;
      }
      const answer = a + b;
      return { a, b, op, answer, displayStr: `${a} + ${b}` };
    } else {
      // Subtraction
      // 90% borrow rate
      const needBorrow = Math.random() < carryRate;
      if (needBorrow && !hasBorrow(a, b)) {
        // Force borrow: adjust ones digits
        const bOnes = randInt(1, 9);
        const aOnes = randInt(0, bOnes - 1);
        a = (aDigits === 2) ? (Math.floor(a / 10) * 10 + aOnes) : aOnes;
        b = (bDigits === 2) ? (Math.floor(b / 10) * 10 + bOnes) : bOnes;
        if (aDigits === 1) a = aOnes === 0 ? 1 : aOnes;
        if (bDigits === 1) b = bOnes;
      }

      // Negative result logic (30% or override)
      const allowNegative = Math.random() < negativeRate;
      if (!allowNegative && a < b) {
        // Swap to ensure non-negative
        [a, b] = [b, a];
      } else if (allowNegative && a >= b) {
        // Force negative: swap
        if (a !== b) [a, b] = [b, a];
      }

      // Avoid 0 operands for 1-digit
      if (a === 0) a = 1;
      if (b === 0) b = 1;

      const answer = a - b;
      return { a, b, op, answer, displayStr: `${a} - ${b}` };
    }
  }

  // Fallback: simple question
  const a = genNum(aDigits);
  const b = genNum(bDigits);
  const answer = op === '+' ? a + b : a - b;
  return { a, b, op, answer, displayStr: `${a} ${op} ${b}` };
}

/**
 * Generate 20 unique questions for a level
 * @param {string[]} types - array of type strings like ["1+2", "2+1"]
 * @param {number} negativeRate - 0~1, probability of negative results in subtraction
 * @param {number} carryRate - 0~1, probability of carry/borrow
 * @returns {Array} array of question objects
 */
export function generateQuestions(types, negativeRate = 0.3, carryRate = 0.9, count = 20) {
  const questions = [];
  const seenPairs = new Set();
  const maxAttempts = count * 30;
  let attempts = 0;

  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const type = types[Math.floor(Math.random() * types.length)];
    const q = generateOne(type, negativeRate, carryRate);
    const key = `${q.a}${q.op}${q.b}`;

    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      questions.push(q);
    }
  }

  // If we couldn't generate enough unique questions, fill with simpler ones
  while (questions.length < count) {
    const type = types[0];
    const q = generateOne(type, 0, 0);
    questions.push(q);
  }

  return questions;
}

export default generateQuestions;
