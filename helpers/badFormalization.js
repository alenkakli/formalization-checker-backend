const {LanguageToVampire} = require('./language');
const {vampire} = require('./vampire');

module.exports = async function evaluateBadFormalization(
    solution, bad_formalizations, exercise
) {

    let language = new LanguageToVampire();
    const formulaToVampire = language.formulaToVampire(exercise);

    solution = formulaToVampire(solution);

    //set eval status for possibility to return if some formalization is correct with solution
    let bad_formalization;
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

    for (let i = 0; i < bad_formalizations.length; i++) {
        bad_formalization = formulaToVampire(bad_formalizations[i].bad_formalization);

        eval_status.solutionToFormalization = await vampire(solution, bad_formalization, 10);
        if (eval_status.solutionToFormalization !== "OK") {
            continue;
        }
        eval_status.formalizationToSolution = await vampire(bad_formalization, solution, 10);
        if (eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK") {
            return bad_formalizations[i].bad_formalization_id;
        }
    }

    return null;

}
