const util = require('util');
const fs = require('fs')
const { PATH_TO_VAMPIRE } = require('../config');
const  {getStructure}  = require('./parse');
const { execFile } = require('child_process');

const execFileWithInput = (file, args, input, callback) =>
    new Promise((resolve, reject) => {
        const child = execFile(file, args,
            (error, stdout, stderr) =>
                error ? reject(error) : resolve({stdout, stderr}));
        child.stdin.write(input);
        child.stdin.end();
    });


module.exports = async function evalWithVampire(
    res, solution, formalization, saveSolutionWithResult, language, exercise, timeLimit = 10
) {
    let eval_status = {
        solutionToFormalization: '',
        formalizationToSolution: '',
        domainSolutionToFormalization: '',
        iSolutionToFormalization: '',
        domainFormalizationToSolution: '',
        iFormalizationToSolution: ''
    };

    eval_status.solutionToFormalization = await vampire(solution, formalization, timeLimit);
    eval_status.formalizationToSolution = await vampire(formalization, solution, timeLimit);
    if (eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK") {
        res.status(200).json(eval_status);
        saveSolutionWithResult(eval_status);
    } else {
        let vampireOutput = await vampireStructure(formalization, solution, timeLimit, language, exercise);
        eval_status.domainFormalizationToSolution = vampireOutput.domain;
        eval_status.iFormalizationToSolution = vampireOutput.prvky !== undefined ? vampireOutput.prvky : 'Nepodarilo sa nájsť štruktúru, na vaše riešenie sa radšej opýtajte. :(\n' ;
        vampireOutput = await vampireStructure(solution, formalization, timeLimit, language, exercise)
        eval_status.domainSolutionToFormalization = vampireOutput.domain;
        eval_status.iSolutionToFormalization = vampireOutput.prvky !== undefined ? vampireOutput.prvky : 'Nepodarilo sa nájsť štruktúru, na vaše riešenie sa radšej opýtajte. :(\n';
        res.status(200).json(eval_status);
        saveSolutionWithResult(eval_status);
    }
}

  async function vampire(formalization1, formalization2, timeLimit) {
    let processInput = toVampireInput(formalization1, formalization2);
    let { stdout, stderr} = await execFileWithInput(`${PATH_TO_VAMPIRE}`, [ '-t', timeLimit ], processInput, '', '' );
    let result = checkVampireResult(stdout);
    if (result === 500) {
      res.status(500);
    }
    result = result[1];
    return setStatus(result);
  }
  async function vampireStructure(formalization1, formalization2, timeLimit, language, exercise) {
      let processInput = toVampireInput(formalization1, formalization2);
      let {stdout, stderr} = await execFileWithInput(`${PATH_TO_VAMPIRE}`, [ '-t', timeLimit, '-sa', 'fmb' ], processInput);
      let result = checkVampireResult(stdout);
      if (result === 500) {
          res.status(500).json(eval_status);
      }
      result = result[1];
      if (stdout.includes("Finite Model Found!")) {
          let structure = stdout.slice(stdout.indexOf("tff"), stdout.length);
          structure = structure.slice(0, structure.indexOf("% SZS"));
          structure = getStructure(structure, language, exercise);
          return {status: setStatus(result), domain: structure.domain, prvky: structure.prvky};
      }
      return {status: setStatus(result), domain: "", predicates: ""};
  }

const toVampireInput = (lhs, rhs) => `fof(a,axiom,${lhs}). fof(b,conjecture,${rhs}).`;

function checkVampireResult(stdout){
  let match = stdout.match(/% Termination reason: ([a-z]+)/i);
  if (!match || match.length !== 2) {
    console.error('Unknown evaluation result');
    return 500;
  }
  return match;
}

function setStatus(result) {
    if (result === 'Refutation') {
        return "OK"
    }
    if (result === 'Satisfiable') {
        return 'WA';
    }
    if (result === 'Time') {
        return 'TE';
    }
    if (result === 'Memory limit') {
        return 'ML';
    } else {
        console.error('Unknown evaluation result.');
    }
}