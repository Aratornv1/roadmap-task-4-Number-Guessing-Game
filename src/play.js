// Ігровий цикл. Ввід і вивід передаються ззовні (ask/print), тож гру можна програти в тесті.
import {
  UserError, MIN, MAX, DIFFICULTIES, DIFFICULTY_ORDER,
  pickSecret, parseDifficulty, parseGuess, checkGuess, getHint, recordScore, plural, formatSeconds,
} from './game.js';

// ask(prompt) повертає введений рядок або null, якщо ввід закінчився.
export async function playRound({ ask, print, secret, difficulty, now = Date.now }) {
  const { chances } = DIFFICULTIES[difficulty];
  const roundStart = now();
  let attempts = 0;
  let hints = 0;

  while (attempts < chances) {
    const askedAt = now();
    const answer = await ask('Enter your guess (or type "hint"): ');
    if (answer === null) return { aborted: true, won: false, attempts };

    if (answer.toLowerCase() === 'hint') {
      const hint = getHint(secret, hints + 1);
      if (hint) {
        hints += 1;
        print(`Hint: ${hint}`);
      } else {
        print('No more hints.');
      }
      continue;
    }

    let guess;
    try {
      guess = parseGuess(answer);
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      print(err.message); // невірний ввід спробу не забирає
      continue;
    }

    attempts += 1;
    const took = formatSeconds(now() - askedAt);
    const result = checkGuess(secret, guess);
    if (result === 'correct') {
      print(`Congratulations! You guessed the correct number in ${plural(attempts, 'attempt')}. (${took})`);
      return { won: true, attempts, ms: now() - roundStart };
    }
    const word = result === 'lower' ? 'less' : 'greater';
    print(`Incorrect! The number is ${word} than ${guess}. (${took})`);
    if (attempts < chances) print(`Chances left: ${chances - attempts}.`);
  }

  print(`Game over! You ran out of chances. The number was ${secret}.`);
  return { won: false, attempts, ms: now() - roundStart };
}

function printBestScores(scores, print) {
  const parts = DIFFICULTY_ORDER
    .filter((key) => scores[key] !== undefined)
    .map((key) => `${DIFFICULTIES[key].name} ${plural(scores[key], 'attempt')}`);
  if (parts.length) print(`Best results: ${parts.join(', ')}.\n`);
}

async function chooseDifficulty({ ask, print }) {
  print('Please select the difficulty level:');
  DIFFICULTY_ORDER.forEach((key, i) => {
    print(`${i + 1}. ${DIFFICULTIES[key].name} (${DIFFICULTIES[key].chances} chances)`);
  });
  print('');
  for (;;) {
    const answer = await ask('Enter your choice: ');
    if (answer === null) return null;
    try {
      return parseDifficulty(answer);
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      print(err.message);
    }
  }
}

export async function runSession({ ask, print, scores = {}, saveScores = () => {}, rng = Math.random, now = Date.now }) {
  print('Welcome to the Number Guessing Game!');
  print(`I'm thinking of a number between ${MIN} and ${MAX}.`);
  print('You have a limited number of chances to guess it. Type "hint" if you get stuck.\n');

  for (;;) {
    printBestScores(scores, print);
    const difficulty = await chooseDifficulty({ ask, print });
    if (difficulty === null) return;
    const { name, chances } = DIFFICULTIES[difficulty];
    print(`\nGreat! You have selected the ${name} difficulty level.`);
    print(`You have ${chances} chances to guess the number. Let's start the game!\n`);

    const round = await playRound({ ask, print, secret: pickSecret(rng), difficulty, now });
    if (round.aborted) return;

    if (round.won) {
      print(`Total time: ${formatSeconds(round.ms)}.`);
      const update = recordScore(scores, difficulty, round.attempts);
      scores = update.scores;
      if (update.isRecord) {
        saveScores(scores);
        print(`New high score for ${name}: ${plural(round.attempts, 'attempt')}!`);
      }
    }

    const again = await ask('\nPlay again? (y/n): ');
    if (again === null || !/^y(es)?$/i.test(again)) return;
    print('');
  }
}
