
import {
  UserError, MIN, MAX, DIFFICULTIES, DIFFICULTY_ORDER,
  pickSecret, parseDifficulty, parseGuess, checkGuess, getHint, recordScore, plural, formatSeconds,
} from './game.js';


export async function playRound({ ask, print, secret, difficulty, now = Date.now }) {// one object for all settings
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
    }// if user input is hint give hint if no more hints print no more hints

    let guess;
    try {
      guess = parseGuess(answer);
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      print(err.message); 
      continue;
    }// if input is valid, check if guess is correct, lower or higher than secret

    attempts += 1;
    const took = formatSeconds(now() - askedAt);// calculate time taken for each guess
    const result = checkGuess(secret, guess);// check if guess is correct, lower or higher than secret
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
}// one round of the game ask guess processes  hits,errors calculate time return results like object 

function printBestScores(scores, print) { //print best scores for each difficulty level 
  const parts = DIFFICULTY_ORDER  
    .filter((key) => scores[key] !== undefined) // only 3 round scores 
    .map((key) => `${DIFFICULTIES[key].name} ${plural(scores[key], 'attempt')}`);// map to string 
  if (parts.length) print(`Best results: ${parts.join(', ')}.\n`);
} // print best scores for each difficulty level if any scores exist

async function chooseDifficulty({ ask, print }) {
  print('Please select the difficulty level:');
  DIFFICULTY_ORDER.forEach((key, i) => {
    print(`${i + 1}. ${DIFFICULTIES[key].name} (${DIFFICULTIES[key].chances} chances)`);// runs through the keys and print pointed list of difficulties with chances
  });
  print('');
  for (;;) {
    const answer = await ask('Enter your choice: ');// ask user to choose difficulty level
    if (answer === null) return null;
    try {
      return parseDifficulty(answer);
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      print(err.message);
    }
  }
}// show the list of difficulties and ask user to choose one, if invalid input print error message and ask again

export async function runSession({ ask, print, scores = {}, saveScores = () => {}, rng = Math.random, now = Date.now }) {// main function to run the game session
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
}// all the game logic is handled here
