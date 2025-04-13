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

  let evaluation = parsedFormalization.evaluate(structure, {});
  return censorTrace(evaluation);
}

function censorTrace(trace) {
  const cleanTrace = { ...trace };

  const quantKinds = ["universalQuant", "existentialQuant"];
  const connectiveKinds = ["conjunction", "disjunction", "implication", "equivalence", "negation"];

  if (quantKinds.includes(cleanTrace.kind)) {
    cleanTrace.kind = "quant";
    delete cleanTrace.symbol;
  } else if (connectiveKinds.includes(cleanTrace.kind)) {
    cleanTrace.kind = "connective";
    delete cleanTrace.symbol;
  }

  if (Array.isArray(cleanTrace.args)) {
    cleanTrace.args = cleanTrace.args.map(arg => censorTrace(arg));
  }

  return cleanTrace;
}

function censorStructure(structure) {
  structure.iC = Object.fromEntries(Object.entries(structure.iC).filter(([key]) => structure.languageConstants.has(key)));
  delete structure.languageConstants;

  structure.structureConstants = structure.structureConstants.map(item => item.includes("fmb") ? item.replace(/^fmb_\$i_/, "$") : item);
  return structure;
}

module.exports = async function evaluate(
  studentSolution, formalizations, exercise, migration
) {
  let allStatuses = [];

  let formalizationsWithLanguageDiff = getFormalizationsWithLanguageDiff(studentSolution, formalizations, exercise);
  const formalizationsOfMatchingLanguage = formalizationsWithLanguageDiff.filter(f => languagesAreEqual(f.languageDiff));

  if (formalizationsOfMatchingLanguage.length === 0) {
    const eval_status = { correctImpliesInput: { result: 'missingOrExtraSymbols' }, inputImpliesCorrect: { result: 'missingOrExtraSymbols' } };
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
  if (!implicationStatusIsTrue(eval_status.correctImpliesInput)) {
    let counterexample = await findStructure(studentSolutionTranslated, constraint, constraintFromProp,
      formalizationsOfMatchingLanguageTranslated[0], language, exercise);

    if (!counterexample.error) {
      eval_status.correctImpliesInput.traces = {};
      eval_status.correctImpliesInput.traces.consequent = await makeTrace(studentSolution, counterexample, exercise);
      eval_status.correctImpliesInput.traces.antecedent = await makeTrace(formalizationsOfMatchingLanguage[0].formalization, counterexample, exercise);
    
      eval_status.correctImpliesInput.counterexample = censorStructure(counterexample);
    }
  }

  if (!implicationStatusIsTrue(eval_status.inputImpliesCorrect)) {
    let counterexample = await findStructure(formalizationsOfMatchingLanguageTranslated[0], constraint, constraintFromProp,
      studentSolutionTranslated, language, exercise);
    
    if (!counterexample.error) {
      eval_status.inputImpliesCorrect.traces = {};
      eval_status.inputImpliesCorrect.traces.antecedent = await makeTrace(studentSolution, counterexample, exercise);
      eval_status.inputImpliesCorrect.traces.consequent = await makeTrace(formalizationsOfMatchingLanguage[0].formalization, counterexample, exercise);
      
      eval_status.inputImpliesCorrect.counterexample = censorStructure(counterexample);
    }
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
//   correctImpliesInput: {
//     result: '',
//     counterexample: { domain: [], iC: {}, iP: {}, iF: {}, languageConstants: [] }  |  { error: '' },
//     traces: { antecedent: {}, consequent: {} }
//   },
//   inputImpliesCorrect: {
//     result: '',
//     counterexample: { domain: [], iC: {}, iP: {}, iF: {}, languageConstants: [] }  |  { error: '' },
//     traces: { antecedent: {}, consequent: {} }
//   }
// };
