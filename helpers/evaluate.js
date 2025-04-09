const { getLanguage } = require('./checks');
const { LanguageToVampire } = require('./language');
const { implicationStatusIsTrue, statusIsEquivalent, checkEquivalence, findStructure } = require('./vampire');
const { getFactoriesForLanguage } = require('./language.js');

function translateToVampire(studentSolution, formalizations, exercise) {
  let { constraint } = getLanguage(exercise);

  let language = new LanguageToVampire();
  const formulaToVampireTranslator = language.formulaToVampire(exercise);
  let studentSolutionTranslated = formulaToVampireTranslator(studentSolution);

  if (constraint !== undefined && constraint !== '') {
    constraint = formulaToVampireTranslator(constraint);
  }

  let constraintFromProp = formalizations[0].constraints;
  if (constraintFromProp !== undefined && constraintFromProp !== '') {
    constraintFromProp = formulaToVampireTranslator(constraintFromProp);
  }

  const formalizationsOfMatchingLanguageTranslated = formalizations.map(f => formulaToVampireTranslator(f.formalization));

  return { studentSolutionTranslated, constraint, constraintFromProp, formalizationsOfMatchingLanguageTranslated, language };
}

function getFormalizationsWithLanguageDiff(studentSolution, formalizations, exercise) {
  let studentLanguage = new LanguageToVampire();
  const studentFormulaToVampireTranslator = studentLanguage.formulaToVampire(exercise);
  studentFormulaToVampireTranslator(studentSolution);

  const newFormalizations = formalizations.map(correctFormalization => {
    const correctLanguage = new LanguageToVampire();
    const correctFormulaToVampireTranslator = correctLanguage.formulaToVampire(exercise);
    correctFormulaToVampireTranslator(correctFormalization.formalization);

    const languageDiff = getLanguageDifferences(studentLanguage, correctLanguage);

    return {
      ...correctFormalization,
      languageDiff
    };
  });

  return newFormalizations;
}

function getLanguageDifferences(lang1, lang2) {
  const diff = {};

  const compareMapKeys = (map1, map2) => {
    const result = {
      extra: [],
      missing: []
    };

    for (const key of map2.keys()) {
      if (!map1.has(key)) {
        result.missing.push(key);
      }
    }

    for (const key of map1.keys()) {
      if (!map2.has(key)) {
        result.extra.push(key);
      }
    }

    return result;
  };

  const mapsToCompare = [
    'constantsToVampire',
    'predicatesToVampire',
    'functionsToVampire',
  ];

  mapsToCompare.forEach((mapName) => {
    const map1 = lang1[mapName];
    const map2 = lang2[mapName];

    if (map1 && map2) {
      const mapKeyDiff = compareMapKeys(map1, map2);
      if (mapKeyDiff.extra.length > 0 || mapKeyDiff.missing.length > 0) {
        diff[mapName.slice(0, -9)] = mapKeyDiff;
      }
    }
  });

  return diff;
}

const languagesAreEqual = (languageDifference) => (
  Object.keys(languageDifference).length === 0
);

async function makeTrace(formalization, structure, exercise) {
  let formalizationLanguage = new LanguageToVampire();
  const formalizationParserFunction = formalizationLanguage.formulaToParsed(exercise);
  const parsedFormalization = formalizationParserFunction(formalization);

  const domain = Object.values(structure.domain);
  const interpretation = {
    languageConstants: structure.domain,
    predicates: structure.symbols.predicates,
    functions: structure.symbols.functions
  }

  let evaluation = parsedFormalization.evaluate(interpretation, {}, domain);
  return evaluation;
}

module.exports = async function evaluate(
  studentSolution, formalizations, exercise, migration
) {
  let allStatuses = [];

  let formalizationsWithLanguageDiff = getFormalizationsWithLanguageDiff(studentSolution, formalizations, exercise);
  const formalizationsOfMatchingLanguage = formalizationsWithLanguageDiff.filter(f => languagesAreEqual(f.languageDiff));

  if (formalizationsOfMatchingLanguage.length === 0) {
    const eval_status = { formalizationToSolution: { result: 'missingOrExtraSymbols' }, solutionToFormalization: { result: 'missingOrExtraSymbols' } };
    eval_status.languageDiff = formalizationsWithLanguageDiff[0].languageDiff;
    return eval_status;
  }

  const { studentSolutionTranslated, constraint, constraintFromProp, formalizationsOfMatchingLanguageTranslated, language } =
    translateToVampire(studentSolution, formalizationsOfMatchingLanguage, exercise);

  for (const formalizationTranslated of formalizationsOfMatchingLanguageTranslated) {
    const eval_status = await checkEquivalence(studentSolutionTranslated, formalizationTranslated);
    allStatuses.push({ ...eval_status });

    if (statusIsEquivalent(eval_status)) return eval_status;
  }

  if (migration === true) return allStatuses[allStatuses.length - 1];

  // call the first saved formalization of the same language in case student solution is not correct with any of the saved solutions
  let eval_status = allStatuses[0];
  if (!implicationStatusIsTrue(eval_status.formalizationToSolution)) {
    eval_status.formalizationToSolution.structure = await findStructure(studentSolutionTranslated, constraint, constraintFromProp,
      formalizationsOfMatchingLanguageTranslated[0], language, exercise);
    eval_status.formalizationToSolution.trace = {};
    eval_status.formalizationToSolution.trace.true = await makeTrace(studentSolution, eval_status.formalizationToSolution.structure, exercise);
    eval_status.formalizationToSolution.trace.false = await makeTrace(formalizationsOfMatchingLanguage[0].formalization, eval_status.formalizationToSolution.structure, exercise);
  }

  if (!implicationStatusIsTrue(eval_status.solutionToFormalization)) {
    eval_status.solutionToFormalization.structure = await findStructure(formalizationsOfMatchingLanguageTranslated[0], constraint, constraintFromProp,
      studentSolutionTranslated, language, exercise);
    eval_status.solutionToFormalization.trace = {};
    eval_status.solutionToFormalization.trace.false = await makeTrace(studentSolution, eval_status.solutionToFormalization.structure, exercise);
    eval_status.solutionToFormalization.trace.true = await makeTrace(formalizationsOfMatchingLanguage[0].formalization, eval_status.solutionToFormalization.structure, exercise);
  }

  return eval_status;
}

// ONLY FOR DEVELOPMENT PURPOSES // printDeep(trace) prints out the whole trace in human readable form
function printDeep(obj, indent = 0) {
  const space = ' '.repeat(indent);

  if (Array.isArray(obj)) {
    return `[ \n${obj.map(item => space + '  ' + printDeep(item, indent + 2)).join(',\n')}\n${space}]`;
  } else if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj).map(([key, value]) => {
      return `${space}${key}: ${printDeep(value, indent + 2)}`;
    });
    return `{\n${entries.join(',\n')}\n${space}}`;
  }
  return String(obj);
}

// const eval_status = {
//   languageDiff: {}
//   formalizationToSolution: {
//     result: '',
//     structure: { domain: '', symbols: '', languageConstants: [] },
//     trace: { true: {}, false: {} }
//   },
//   solutionToFormalization: {
//     result: '',
//     structure: { domain: '', symbols: '', languageConstants: [] },
//     trace: { true: {}, false: {} }
//   }
// };
