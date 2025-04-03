const {getLanguage} = require('./checks');
const {LanguageToVampire} = require('./language');
const {checkImplication, findStructure} = require('./vampire');
const { getFactoriesForLanguage } = require('./language.js');

async function translateToVampireAndCheckSymbols(studentSolution, formalizations, exercise) {
  let { constraint } = getLanguage(exercise);

  let language = new LanguageToVampire();
  let studentLanguage = new LanguageToVampire();

  const studentFormulaToVampireTranslator = studentLanguage.formulaToVampire(exercise);
  studentFormulaToVampireTranslator(studentSolution);

  const formulaToVampireTranslator = language.formulaToVampire(exercise);
  let studentSolutionTranslated = formulaToVampireTranslator(studentSolution);

  if (constraint !== undefined && constraint !== '') {
    constraint = formulaToVampireTranslator(constraint);
  }

  let constraintFromProp = formalizations[0].constraints;
  if (constraintFromProp !== undefined && constraintFromProp !== '') {
    constraintFromProp = formulaToVampireTranslator(constraintFromProp);
  }

  formalizations.map(f => formulaToVampireTranslator(f.formalization));
  let translatedFormalizationsOfMatchingLanguage = { formalizations: [], indexesOfOriginalFormalizations: [] };
  let missingOrExtraSymbols = { extra: [], missing: [] };
  for (let [index, correctFormalization] of formalizations.entries()) {
    let correctLanguage = new LanguageToVampire();
    const correctFormulaToVampireTranslator = correctLanguage.formulaToVampire(exercise);
    correctFormulaToVampireTranslator(correctFormalization.formalization);

    let translatedCorrectFormalization = formulaToVampireTranslator(correctFormalization.formalization);

    const languageDifferences = getLanguageDifferences(studentLanguage, correctLanguage);
    if (languagesAreEqual(languageDifferences)) {
      translatedFormalizationsOfMatchingLanguage.formalizations.push(translatedCorrectFormalization);
      translatedFormalizationsOfMatchingLanguage.indexesOfOriginalFormalizations.push(index);
    } else if (missingOrExtraSymbols.extra.length === 0 && missingOrExtraSymbols.missing.length === 0) {
      missingOrExtraSymbols = languageDifferences;
    }
  }

  return { studentSolutionTranslated, constraint, constraintFromProp, translatedFormalizationsOfMatchingLanguage, language, missingOrExtraSymbols };
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
        diff[mapName.slice(0,-9)] = mapKeyDiff;
      }
    }
  });

  return diff;
}

const languagesAreEqual = (languageDifference) => (
  Object.keys(languageDifference).length === 0
);

const implicationStatusIsTrue = (implicationStatus) => (
  implicationStatus.result === "OK"
);

const statusIsEquivalent = (eval_status) => (
  implicationStatusIsTrue(eval_status.formalizationToSolution) &&
  implicationStatusIsTrue(eval_status.solutionToFormalization)
);

const evaluateEquivalence = async (solution, formalization) => ({
  solutionToFormalization: {
    result: await checkImplication(solution, formalization)
  },
  formalizationToSolution: {
    result: await checkImplication(formalization, solution)
  }
});

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
  // console.log(printDeep(evaluation));
  return evaluation;
}

module.exports = async function evaluate(
    studentSolution, formalizations, exercise, migration
) {
  // console.log("zavolal sa evaluate");
  // console.log(studentSolution);
  // console.log(formalizations[0].formalization);

  let allStatuses = [];

  const { studentSolutionTranslated, constraint, constraintFromProp, translatedFormalizationsOfMatchingLanguage, language, missingOrExtraSymbols } =
    await translateToVampireAndCheckSymbols(studentSolution, formalizations, exercise);

  if (translatedFormalizationsOfMatchingLanguage.formalizations.length === 0) {
    const eval_status = {formalizationToSolution: {result: 'missingOrExtraSymbols'}, solutionToFormalization: {result: 'missingOrExtraSymbols'}};
    eval_status.languageDifferences = missingOrExtraSymbols;
    return eval_status;
  } else {
    for (const formalization of translatedFormalizationsOfMatchingLanguage.formalizations) {
      const eval_status = await evaluateEquivalence(studentSolutionTranslated, formalization);
      allStatuses.push({ ... eval_status });
  
      if (statusIsEquivalent(eval_status)) return eval_status;
    }
  }

  if (migration === true) return allStatuses[allStatuses.length - 1];

  // console.log("Statusy " + allStatuses);
  // console.log("Prelozena solution" + studentSolutionTranslated);
  // console.log("Prelozena spravna formalizacia" + translatedFormalizationsOfMatchingLanguage.formalizations  [0]);

  // call the first saved formalization of the same language in case student solution is not correct with any of the saved solutions
  let eval_status = allStatuses[0];
  if (!implicationStatusIsTrue(eval_status.formalizationToSolution)) {
    eval_status.formalizationToSolution.structure = await findStructure(studentSolutionTranslated, constraint, constraintFromProp,
                                                                        translatedFormalizationsOfMatchingLanguage.formalizations[0], language, exercise);
    eval_status.formalizationToSolution.trace = {};
    eval_status.formalizationToSolution.trace.true = await makeTrace(studentSolution, eval_status.formalizationToSolution.structure, exercise);
    eval_status.formalizationToSolution.trace.false = await makeTrace(formalizations[translatedFormalizationsOfMatchingLanguage.indexesOfOriginalFormalizations[0]].formalization, eval_status.formalizationToSolution.structure, exercise);
  }
    
  if (!implicationStatusIsTrue(eval_status.solutionToFormalization)) {
    eval_status.solutionToFormalization.structure = await findStructure(translatedFormalizationsOfMatchingLanguage.formalizations[0], constraint, constraintFromProp,
                                                                        studentSolutionTranslated, language, exercise);
    eval_status.solutionToFormalization.trace = {};
    eval_status.solutionToFormalization.trace.false = await makeTrace(studentSolution, eval_status.solutionToFormalization.structure, exercise);
    eval_status.solutionToFormalization.trace.true = await makeTrace(formalizations[translatedFormalizationsOfMatchingLanguage.indexesOfOriginalFormalizations[0]].formalization, eval_status.solutionToFormalization.structure, exercise);
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
  //   languageDifferences: {}
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
