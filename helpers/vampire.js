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

async function evalWithVampire(
    solution, constraintToExer, constraintToProp, formalization, language, exercise, timeLimit = 10
) {
    let eval_status = {
        solutionToFormalization: '',
        m1: '',
        m2: '',
        formalizationToSolution: '',
        domainSolutionToFormalization: '',
        symbolsSolutionToFormalization: '',
        domainFormalizationToSolution: '',
        symbolsFormalizationToSolution: '',
        languageContants: ''
    };
    eval_status.solutionToFormalization = await vampire(solution, formalization, timeLimit);
    eval_status.formalizationToSolution = await vampire(formalization, solution, timeLimit);
    if (eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK") {
        return eval_status;
    } else {
        let notFound = ' sa nepodarilo nájsť automaticky. Ak neviete nájsť chybu, poraďte sa s vyučujúcimi.';
        let structureSolutionToFormalization = ', v ktorej je vaša formalizácia pravdivá, ale hľadaná správna formalizácia je nepravdivá'
        let structureFormalizationToSolution = ', v ktorej je vaša formalizácia nepravdivá, ale hľadaná správna formalizácia je pravdivá'

        let vampireOutput = await callVampireConstraints(formalization, solution, constraintToExer, constraintToProp, timeLimit, language, exercise);
        eval_status.domainFormalizationToSolution = vampireOutput.constants !== undefined ? vampireOutput.constants : '';
        eval_status.symbolsFormalizationToSolution = vampireOutput.symbols !== undefined ? vampireOutput.symbols : '' ;
        eval_status.m1 =  vampireOutput.m !== '' ? "Štruktúra " + vampireOutput.m + structureFormalizationToSolution + ":"
                            : "Štruktúru" + vampireOutput.m  + structureFormalizationToSolution + ","  + notFound;
        eval_status.languageContants = vampireOutput.language === undefined ?
            [] : Array.from(vampireOutput.language.constants) ;

        vampireOutput = await callVampireConstraints(solution, formalization, constraintToExer, constraintToProp, timeLimit, language, exercise)
        eval_status.domainSolutionToFormalization = vampireOutput.constants !== undefined ? vampireOutput.constants : '';
        eval_status.m2 = vampireOutput.m !== '' ? "Štruktúra " + vampireOutput.m + structureSolutionToFormalization + ":"
            : "Štruktúra"+ vampireOutput.m  + structureSolutionToFormalization + ","  + notFound ;
        eval_status.symbolsSolutionToFormalization = vampireOutput.symbols !== undefined ? vampireOutput.symbols : '';

        return eval_status;
    }
}

  async function vampire(formalization1, formalization2, timeLimit) {
    try{
        let processInput = toVampireInput(formalization1, "", "", formalization2);
        let { stdout, stderr} = await execFileWithInput(`${PATH_TO_VAMPIRE}`, [ '-t', timeLimit ], processInput, '', '' );
        let result = checkVampireResult(stdout);
        if (result === 500) {
            return setStatus(result);
        }

        result = result[1];
        return setStatus(result);
    }
    catch (err){
        if(err.message.substr(0, 15 ) === "Command failed:" && err.code === 1){
            return setStatus("Time");
        }
        console.error(`Unknown evaluation result: ${err}\n${err.stack}`);
        return setStatus(`failed`);
    }

  }
  async function vampireStructure(formalization1, formalization2, constraintToExer, constraintToProp, timeLimit, language, exercise) {
      let processInput = toVampireInput(formalization1, constraintToExer, constraintToProp, formalization2);
      try{
          let {stdout, stderr} = await execFileWithInput(`${PATH_TO_VAMPIRE}`, [ '-t', timeLimit, '-sa', 'fmb' ], processInput);

          let result = checkVampireResult(stdout);
          if (result === 500) {
              return {status: setStatus(result), domain: "", predicates: "", m: ""};
          }
          result = result[1];
          if (stdout.includes("Finite Model Found!")) {
              let structure = stdout.slice(stdout.indexOf("tff"), stdout.length);
              structure = structure.slice(0, structure.indexOf("% SZS"));
              structure = getStructure(structure, language, exercise);
              return {status: setStatus(result), constants: structure.constants, symbols: structure.symbols, m:"𝓜 = (𝐷, 𝑖)", language: structure.language};
          }
          return {status: setStatus(result), domain: "", predicates: "", m: ""};
      }
      catch (err){
          if(err.message.substr(0, 15 ) === "Command failed:" && err.code === 1){
              return {status: setStatus("Time"), domain: "", predicates: "", m: ""};
          }
          console.error(`Unknown evaluation result: ${err}\n${err.stack}`);
          return {status: setStatus(`failed`), domain: "", predicates: "", m: ""};
      }

  }

  async function callVampireConstraints(formalization1, formalization2, constraintToExer, constraintToProp, timeLimit, language, exercise){
       let vampireOutput = await vampireStructure(formalization1, formalization2, constraintToExer, constraintToProp, timeLimit, language, exercise);
       if(vampireOutput.m === ""){
          vampireOutput = await vampireStructure(formalization1, formalization2, "", constraintToProp, timeLimit, language, exercise);
           if(vampireOutput.m === ""){
               vampireOutput = await vampireStructure(formalization1, formalization2, constraintToExer, "", timeLimit, language, exercise);
               if(vampireOutput.m === ""){
                   vampireOutput = await vampireStructure(formalization1, formalization2, "", "", timeLimit, language, exercise);
               }
           }
       }
      return vampireOutput;

  }

const toVampireInput = (lhs, constr1, constr2, rhs) => {
    let input = `fof(a,axiom,${lhs}). fof(b,conjecture,${rhs}).`
    if(constr1 !== undefined && constr1 !== ''){
        input += `fof(a,axiom,${constr1}).`;
    }
    if(constr2 !== undefined && constr2 !== ''){
        input += `fof(a,axiom,${constr2}).`;
    }
    return input;
}

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
        return 'Unknown'
    }
}
module.exports = {
    vampire,
    evalWithVampire
};
