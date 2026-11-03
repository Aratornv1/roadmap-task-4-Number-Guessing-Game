import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UserError } from './game.js';

const defaultFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'scores.json');

export const scoresFile = () => process.env.GUESSING_GAME_FILE || defaultFile;
// defines where save records 
export function loadScores(file = scoresFile()) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new UserError(`Scores file is corrupted: ${file}`);
  }
}// return records or throw error if file is corrupted

export function saveScores(scores, file = scoresFile()) { //save records to file 
  mkdirSync(dirname(file), { recursive: true }); //create directory if it doesn't exist
  writeFileSync(file, JSON.stringify(scores, null, 2) + '\n'); // write records to file like json
}
