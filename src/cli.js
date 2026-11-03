#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { UserError } from './game.js';
import { runSession } from './play.js';
import { loadScores, saveScores } from './storage.js';


const rl = createInterface({ input: process.stdin });//create readline interface to read user input from stdin
const lines = rl[Symbol.asyncIterator](); // create an async iterator to read lines from stdin

async function ask(prompt) {
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) {
    process.stdout.write('\n');
    return null;
  }
  return value.trim();
}// ask user for input and return the trimmed value, if no input return null

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
}// run the game session and handle any errors, close the readline interface when done
