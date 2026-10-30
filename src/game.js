// Правила гри без вводу/виводу — їх легко тестувати.

export class UserError extends Error {}

export const MIN = 1;
export const MAX = 100;

export const DIFFICULTIES = {
  easy: { name: 'Easy', chances: 10 },
  medium: { name: 'Medium', chances: 5 },
  hard: { name: 'Hard', chances: 3 },
};

// Порядок задає номери в меню: 1 — easy, 2 — medium, 3 — hard.
export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

// rng — функція, що повертає число з [0, 1); у тестах підставляємо свою.
export function pickSecret(rng = Math.random) {
  return MIN + Math.floor(rng() * (MAX - MIN + 1));
}

export function parseDifficulty(text) {
  const value = String(text ?? '').trim().toLowerCase();
  const key = /^\d+$/.test(value) ? DIFFICULTY_ORDER[Number(value) - 1] : value;
  if (!Object.hasOwn(DIFFICULTIES, key)) {
    throw new UserError('Please choose 1, 2 or 3 (or easy, medium, hard).');
  }
  return key;
}

export function parseGuess(text) {
  const value = String(text ?? '').trim();
  const guess = Number(value);
  if (!/^\d+$/.test(value) || guess < MIN || guess > MAX) {
    throw new UserError(`Please enter a whole number from ${MIN} to ${MAX}.`);
  }
  return guess;
}

// 'lower' — загадане число менше за здогадку, 'higher' — більше.
export function checkGuess(secret, guess) {
  if (guess === secret) return 'correct';
  return secret < guess ? 'lower' : 'higher';
}

// Підказки відкриваються по черзі й не коштують спроб. Після останньої повертається null.
export function getHint(secret, level) {
  if (level === 1) return `The number is ${secret % 2 === 0 ? 'even' : 'odd'}.`;
  if (level === 2) {
    const low = Math.floor((secret - 1) / 10) * 10 + 1;
    return `The number is between ${low} and ${low + 9}.`;
  }
  return null;
}

// Рекорд — найменша кількість спроб на рівні складності. Не змінює вхідний об'єкт.
export function recordScore(scores, difficulty, attempts) {
  const best = scores[difficulty];
  const isRecord = best === undefined || attempts < best;
  return { scores: isRecord ? { ...scores, [difficulty]: attempts } : scores, isRecord };
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
