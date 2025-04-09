const {LanguageToVampire} = require('./language');
const {checkEquivalence, statusIsEquivalent} = require('./vampire');

module.exports = async function evaluateBadFormalization(
    solution, bad_formalizations, exercise
) {

    let language = new LanguageToVampire();
    const formulaToVampire = language.formulaToVampire(exercise);

    solution = formulaToVampire(solution);

    for (const bad_form of bad_formalizations) {
        const tptp_bad_form = formulaToVampire(bad_form.bad_formalization);

        let eval_status = await checkEquivalence(solution, tptp_bad_form);
        if (statusIsEquivalent(eval_status)) {
            return bad_form.bad_formalization_id;
        }
    }

    return null;

}
