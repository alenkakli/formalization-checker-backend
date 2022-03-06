const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')
const { PATH_TO_VAMPIRE } = require('../config');
const  {getStructure}  = require('./parser');


module.exports = function evalWithVampire(
  res, solution, formalization, saveSolutionWithResult, timeLimit = 10
) {
  let eval_status = {
    solutionToFormalization: '',
    formalizationToSolution: '',
    domain: '',
    predicates: ''
  };

  run(solution, formalization, timeLimit, false).then(
      res1 => {
        eval_status.solutionToFormalization = res1
        run(formalization,solution, timeLimit, false).then(
          res2 => {
            eval_status.formalizationToSolution = res2
            if(eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK"){
              res.status(200).json(eval_status);
              saveSolutionWithResult(eval_status);
            }
            else{
              run(formalization,solution, timeLimit, true).then(
                  res3 => {
                    console.log(eval_status);
                    if(eval_status.domain !== ""){
                      res.status(200).json(eval_status);
                      saveSolutionWithResult(eval_status);
                    }
                    else{
                      run(formalization,solution, timeLimit, true).then(
                          res4 => {
                            res.status(200).json(eval_status);
                            saveSolutionWithResult(eval_status);
                          }
                      )
                    }
                  }
              )
            }
          }
        )
      });


  async function runVampireCommand(processInput, findStructure, timeLimit)  {
    try {
      let stdout;
      let stderr;
      await exec(generateCommand(processInput, PATH_TO_VAMPIRE, timeLimit, findStructure)).
      then(c => {stdout = c.stdout;
                stderr = c.stderr});
      if(stderr){
        console.error(stderr);
        res.status(400);
      }
      return stdout;
    } catch (e) {
      console.error(e.message);
      res.status(500); // should contain code (exit code) and signal (that caused the termination).
    }
  }
  async function run(formalization1, formalization2, timeLimit, findStructure) {
    let processInput = toVampireInput(formalization1, formalization2);
    let stdout = await runVampireCommand(processInput, findStructure, timeLimit);

    let result = checkResult(stdout);
    if (result === 500) {
      res.status(500).json(eval_status);
    }
    result = result[1];
    if(findStructure && stdout.includes("Finite Model Found!")){
      let structure = stdout.slice(stdout.indexOf("tff"), stdout.length);
      structure = structure.slice(0, structure.indexOf("% SZS"));
      let pom = getStructure(structure);
      eval_status.domain = pom.domain;
      eval_status.predicates = pom.predicates;
    }
    return setStatus(result);
  }


};

const toVampireInput = (lhs, rhs) => {
  return `fof(a,axiom,${lhs}). fof(b,conjecture,${rhs}).`
};

const generateCommand = (processInput, pathToVampire, timeLimit, findStructure) => {
  if(findStructure){
    return `echo "${processInput}" | ${pathToVampire} -t ${timeLimit} -sa fmb`
  }
  return `echo "${processInput}" | ${pathToVampire} -t ${timeLimit}`
};

function checkResult(stdout){
  let match = stdout.match(/% Termination reason: ([a-z]+)/i);
  if (!match || match.length !== 2) {
    console.error('Unknown evaluation result');
    return 500;
  }
  return match;
}

function setStatus(result){
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
  }
  else {
    console.error('Unknown evaluation result.');
  }
}



