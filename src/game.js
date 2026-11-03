

export class UserError extends Error {}

export const MIN = 1;
export const MAX = 100;
//range game constants
export const DIFFICULTIES = {
  easy: { name: 'Easy', chances: 10 },
  medium: { name: 'Medium', chances: 5 },
  hard: { name: 'Hard', chances: 3 },
};//object with difficulty levels and their properties


export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];// array keys  with right order


export function pickSecret(rng = Math.random) {
  return MIN + Math.floor(rng() * (MAX - MIN + 1));
}//return random number between MIN and MAX inclusive

export function parseDifficulty(text) {
  const value = String(text ?? '').trim().toLowerCase();// convert input to string, trim whitespace
  const key = /^\d+$/.test(value) ? DIFFICULTY_ORDER[Number(value) - 1] : value; // if input only numbers give the corresponding key from DIFFICULTY_ORDER, otherwise use the input as key
  if (!Object.hasOwn(DIFFICULTIES, key)) { // check if object has the key, if not throw error
    throw new UserError('Please choose 1, 2 or 3 (or easy, medium, hard).');
  }
  return key;
} // convert input to difficulty key, throw error if invalid

export function parseGuess(text) {
  const value = String(text ?? '').trim(); // 23
  const guess = Number(value); // check if input is a number
  if (!/^\d+$/.test(value) || guess < MIN || guess > MAX) { // whole number  1<= guess <= 100
    throw new UserError(`Please enter a whole number from ${MIN} to ${MAX}.`);
  }
  return guess;
}// check if user input is a valid guess, throw error if invalid


export function checkGuess(secret, guess) {
  if (guess === secret) return 'correct';
  return secret < guess ? 'lower' : 'higher';
} // check if guess is correct, lower or higher than secret


export function getHint(secret, level) {
  if (level === 1) return `The number is ${secret % 2 === 0 ? 'even' : 'odd'}.`;// if level is 1, return if secret is even or odd
  if (level === 2) { // if level is 2 return range of 10, otherwise return null
    const low = Math.floor((secret - 1) / 10) * 10 + 1;
    return `The number is between ${low} and ${low + 9}.`;
  }
  return null;
}// give hint  


export function recordScore(scores, difficulty, attempts) {
  const best = scores[difficulty];
  const isRecord = best === undefined || attempts < best;
  return { scores: isRecord ? { ...scores, [difficulty]: attempts } : scores, isRecord };
}// record score 

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`; //add  1 attempts or 2 attempts depending on the number of attempts

export const formatSeconds = (ms) => `${(ms / 1000).toFixed(1)}s`; // convert milliseconds to seconds 
