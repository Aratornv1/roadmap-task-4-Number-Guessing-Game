import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UserError } from './game.js';

const defaultFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'scores.json');

export const scoresFile = () => process.env.GUESSING_GAME_FILE || defaultFile;

export function loadScores(file = scoresFile()) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new UserError(`Scores file is corrupted: ${file}`);
  }
}

export function saveScores(scores, file = scoresFile()) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(scores, null, 2) + '\n');
}
