const { execFile } = require('child_process');
const { PATH_TO_VAMPIRE } = require('../config');


module.exports = function evalWithVampire(
  res, solution, formalization, timeLimit = 10
) {

  let processInput = toVampireInput(solution, formalization);
  let processArgs = [ '-t', timeLimit ];

  let status = {
    solutionToFormalization: '',
    formalizationToSolution: ''
  };

  const callback = (error, stdout, stderr) => {
    if (error) {
      console.error(error.message);
      res.sendStatus(400);
      return;
    }
    if (stderr) {
      console.error(stderr);
      res.sendStatus(400);
      return;
    }

    let match = stdout.match(/% Termination reason: ([a-z]+)/i);
    if (!match || match.length !== 2) {
      console.error('Unknown evaluation result');
      res.sendStatus(400);
    }

    let result = match[1];

    if (result == 'Refutation') {
      if (status.solutionToFormalization == '') {
        status.solutionToFormalization = 'OK';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        status.formalizationToSolution = 'OK';
        res.status(200).json(status);
      }
    } else if (result == 'Satisfiable') {
      if (status.solutionToFormalization == '') {
        status.solutionToFormalization = 'WA';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        status.formalizationToSolution= 'WA';
        res.status(200).json(status);
      }
    } else if (result == 'Time') {
      if (status.solutionToFormalization == '') {
        status.solutionToFormalization = 'TE';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        status.formalizationToSolution = 'TE';
        res.status(200).json(status);
      }
    } else {
      console.error('Unknown evaluation result.');
      res.sendStatus(400);
    }
  }

  let process = execFile(`${PATH_TO_VAMPIRE}`, processArgs, callback);
  process.stdin.write(processInput);
  process.stdin.end();
};

const toVampireInput = (lhs, rhs) => {
  return `fof(a,axiom,${lhs}). fof(b,conjecture,${rhs}).`
};
