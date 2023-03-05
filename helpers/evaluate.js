const {getLanguage} = require('./checks');
const {LanguageToVampire} = require('./language');
const {vampire, evalWithVampire} = require('./vampire');

module.exports = async function evaluate(
    solution, formalizations, exercise
) {

  let {constraint} = getLanguage(exercise);
  let language = new LanguageToVampire();

  const formulaToVampire = language.formulaToVampire(exercise);

  solution = formulaToVampire(solution);

  if (constraint !== undefined && constraint !== '') {
    constraint = formulaToVampire(constraint);
  }

  let constraintFromProp = formalizations[0].constraints;
  if (constraintFromProp !== undefined && constraintFromProp !== '') {
    constraintFromProp = formulaToVampire(constraintFromProp);

  }

  //set eval status for possibility to return if some formalization is correct with solution
  let formalization;
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
  for (let i = 0; i < formalizations.length; i++) {
    console.log(`\t\tformulaToVampire(formalizations[${i}].formalization)`);
    formalization = formulaToVampire(formalizations[i].formalization);

    console.log("\t\tvampire(...)");
    eval_status.solutionToFormalization = await vampire(solution, formalization, 10);
    eval_status.formalizationToSolution = await vampire(formalization, solution, 10);
    if (eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK") {
      return eval_status;
    }
  }

  // call first saved formalization in case solution is not correct with none of saved solution
  formalization = formulaToVampire(formalizations[0].formalization);
  return evalWithVampire(solution, constraint, constraintFromProp,  formalization, language, exercise);

}
