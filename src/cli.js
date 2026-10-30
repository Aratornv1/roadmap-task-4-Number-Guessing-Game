#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { UserError } from './game.js';
import { runSession } from './play.js';
import { loadScores, saveScores } from './storage.js';

// Рядки вводу читаємо по одному через асинхронний ітератор: так працює і термінал, і `echo 5 | node ...`.
const rl = createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();

async function ask(prompt) {
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) {
    process.stdout.write('\n');
    return null;
  }
  return value.trim();
}

try {
  await runSession({
    ask,
    print: console.log,
    scores: loadScores(),
    saveScores,
  });
} catch (err) {
  console.error(err instanceof UserError ? `Error: ${err.message}` : err);
  process.exitCode = 1;
} finally {
  rl.close();
}
