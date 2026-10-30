import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playRound, runSession } from '../src/play.js';
import {
  pickSecret, parseDifficulty, parseGuess, checkGuess, getHint, recordScore, UserError,
} from '../src/game.js';

// Сценарій відповідей замість живого вводу; після останньої відповіді ввід «закінчується».
function fakeIO(answers) {
  const queue = [...answers];
  const out = [];
  return {
    out,
    ask: async (prompt) => {
      out.push(prompt);
      return queue.length ? queue.shift() : null;
    },
    print: (text) => out.push(text),
    text: () => out.join('\n'),
  };
}

test('pickSecret stays within 1..100', () => {
  assert.equal(pickSecret(() => 0), 1);
  assert.equal(pickSecret(() => 0.999999), 100);
  assert.equal(pickSecret(() => 0.5), 51);
});

test('parseDifficulty accepts numbers and names', () => {
  assert.equal(parseDifficulty('1'), 'easy');
  assert.equal(parseDifficulty(' 2 '), 'medium');
  assert.equal(parseDifficulty('HARD'), 'hard');
  for (const bad of ['0', '4', '', 'abc', 'toString', undefined]) {
    assert.throws(() => parseDifficulty(bad), UserError);
  }
});

test('parseGuess accepts only whole numbers from 1 to 100', () => {
  assert.equal(parseGuess(' 42 '), 42);
  assert.equal(parseGuess('100'), 100);
  for (const bad of ['0', '101', '-5', '3.5', 'abc', '', '1e1']) {
    assert.throws(() => parseGuess(bad), UserError);
  }
});

test('checkGuess says which way to go', () => {
  assert.equal(checkGuess(30, 30), 'correct');
  assert.equal(checkGuess(30, 50), 'lower');
  assert.equal(checkGuess(30, 10), 'higher');
});

test('hints open in order and run out', () => {
  assert.equal(getHint(30, 1), 'The number is even.');
  assert.equal(getHint(31, 1), 'The number is odd.');
  assert.equal(getHint(30, 2), 'The number is between 21 and 30.');
  assert.equal(getHint(31, 2), 'The number is between 31 and 40.');
  assert.equal(getHint(100, 2), 'The number is between 91 and 100.');
  assert.equal(getHint(30, 3), null);
});

test('recordScore keeps the fewest attempts per difficulty', () => {
  const first = recordScore({}, 'easy', 6);
  assert.deepEqual(first, { scores: { easy: 6 }, isRecord: true });
  assert.equal(recordScore(first.scores, 'easy', 6).isRecord, false);
  assert.deepEqual(recordScore(first.scores, 'easy', 3).scores, { easy: 3 });
  assert.deepEqual(recordScore(first.scores, 'hard', 3).scores, { easy: 6, hard: 3 });
  assert.deepEqual(first.scores, { easy: 6 }); // вхідний об'єкт не змінився
});

test('round from the task example: medium, secret 30, guesses 50 25 35 30', async () => {
  const io = fakeIO(['50', '25', '35', '30']);
  const result = await playRound({ ...io, secret: 30, difficulty: 'medium' });
  const text = io.text();
  assert.match(text, /The number is less than 50\./);
  assert.match(text, /The number is greater than 25\./);
  assert.match(text, /The number is less than 35\./);
  assert.match(text, /Congratulations! You guessed the correct number in 4 attempts\./);
  assert.equal(result.won, true);
  assert.equal(result.attempts, 4);
});

test('round is lost when chances run out and reveals the number', async () => {
  const io = fakeIO(['1', '2', '3']);
  const result = await playRound({ ...io, secret: 77, difficulty: 'hard' });
  assert.equal(result.won, false);
  assert.equal(result.attempts, 3);
  assert.match(io.text(), /Game over! You ran out of chances\. The number was 77\./);
});

test('invalid input and hints do not spend chances', async () => {
  const io = fakeIO(['abc', '0', 'hint', 'hint', 'hint', '99', '77']);
  const result = await playRound({ ...io, secret: 77, difficulty: 'hard' });
  const text = io.text();
  assert.equal(result.attempts, 2); // лише 99 і 77
  assert.equal(result.won, true);
  assert.match(text, /Please enter a whole number from 1 to 100\./);
  assert.match(text, /Hint: The number is odd\./);
  assert.match(text, /Hint: The number is between 71 and 80\./);
  assert.match(text, /No more hints\./);
  assert.match(text, /in 2 attempts/);
});

test('single attempt is not pluralised', async () => {
  const io = fakeIO(['5']);
  await playRound({ ...io, secret: 5, difficulty: 'easy' });
  assert.match(io.text(), /in 1 attempt\./);
});

test('timer shows how long each guess took', async () => {
  let t = 0;
  const now = () => (t += 1500); // кожен виклик «минає» 1.5 с
  const io = fakeIO(['10']);
  await playRound({ ...io, secret: 20, difficulty: 'easy', now });
  assert.match(io.text(), /greater than 10\. \(1\.5s\)/);
});

test('session: play twice, record is saved only when beaten', async () => {
  const saved = [];
  const io = fakeIO(['2', '50', 'y', '2', '50', 'n']);
  await runSession({
    ...io, rng: () => 0.49, saveScores: (s) => saved.push(s),
  });
  // rng 0.49 -> число 50: обидва раунди виграно з першої спроби
  assert.deepEqual(saved, [{ medium: 1 }]);
  assert.match(io.text(), /New high score for Medium: 1 attempt!/);
  assert.equal(io.text().match(/New high score/g).length, 1);
  assert.match(io.text(), /Best results: Medium 1 attempt\./);
});

test('session: wrong difficulty choice is asked again, end of input exits', async () => {
  const io = fakeIO(['9', 'oops']);
  await runSession(io);
  assert.match(io.text(), /Please choose 1, 2 or 3/);
});
