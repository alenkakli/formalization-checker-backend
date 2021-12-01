const { execFile } = require('child_process');
const { PATH_TO_VAMPIRE } = require('../config');
module.exports = function evalWithVampire(
  res, solution, formalization, saveSolutionWithResult, timeLimit = 10
) {
  let processInput = toVampireInput(solution, formalization);
  let processArgs = [ '-t', timeLimit ];

  let eval_status = {
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
      res.sendStatus(500).json(eval_status);
    }

    let result = match[1];

    if (result === 'Refutation') {
      if (eval_status.solutionToFormalization === '') {
        eval_status.solutionToFormalization = 'OK';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        eval_status.formalizationToSolution = 'OK';
        res.status(200).json(eval_status);
        saveSolutionWithResult(eval_status);
      }
    } else if (result === 'Satisfiable') {
      if (eval_status.solutionToFormalization === '') {
        eval_status.solutionToFormalization = 'WA';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        eval_status.formalizationToSolution= 'WA';
        res.status(200).json(eval_status);
        saveSolutionWithResult(eval_status);
      }
    } else if (result === 'Time') {
      if (eval_status.solutionToFormalization === '') {
        eval_status.solutionToFormalization = 'TE';

        let input = toVampireInput(formalization, solution);
        let args = [ '-t', timeLimit ];

        let child = execFile(`${PATH_TO_VAMPIRE}`, args, callback);
        child.stdin.write(input);
        child.stdin.end();
      } else {
        eval_status.formalizationToSolution = 'TE';
        res.status(200).json(eval_status);
        saveSolutionWithResult(eval_status);
      }
    } else {
      console.error('Unknown evaluation result.');
      res.sendStatus(500).json(eval_status);
    }

  }

  let process = execFile(`${PATH_TO_VAMPIRE}`, processArgs, callback);
  process.stdin.write(processInput);
  process.stdin.end();
};

const toVampireInput = (lhs, rhs) => {
  return `fof(a,axiom,${lhs}). fof(b,conjecture,${rhs}).`
};
