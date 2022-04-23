const {
  parseConstants,
  parsePredicates,
  parseFunctions,
  parseFormulaWithPrecedence
} = require("@fmfi-uk-1-ain-412/js-fol-parser");

const getLanguage = (exercise) => {
  constants = parseConstants(exercise.constants);
  predicates = parsePredicates(exercise.predicates);
  functions = parseFunctions(exercise.functions);
  constraint = exercise.constraint;
  if (containsDuplicates(constants)
      || containsDuplicates(predicates.map(x => x.name))
      || containsDuplicates(functions.map(x => x.name))) {
    throw new Error("Language contains duplicate symbols.");
  }

  constants = new Set(constants);
  predicates = arrayToArityMap(predicates);
  functions = arrayToArityMap(functions);

  if (containsClashes(constants, predicates, functions)) {
    throw new Error("Language contains clashes between symbols.");
  }

  return { constants, predicates, functions, constraint };
}

const checkExercise = (exercise) => {
  if (!('title' in exercise) || !('description' in exercise)
      || !('constants' in exercise) || !('predicates' in exercise)
      || !('functions' in exercise) || !('propositions' in exercise)
      || !('constraint' in exercise)) {
    return false;
  }

  let language = null;
  try {
    language = getLanguage(exercise);
  } catch (err) {
    console.error(err.message);
    return false;
  }

  for (let p of exercise.propositions) {
    if (!checkProposition(p, language)) {
      return false;
    }
  }

  return true;
};

const checkProposition = (propositionObj, language) => {
  if (!('proposition' in propositionObj)
      || !('formalizations' in propositionObj)) {
    return false;
  }

  for (let f of propositionObj.formalizations) {
    if (!checkFormalization(f, language)) {
      return false;
    }
  }

  return true;
};

const checkFormalization = (
  formalization,
  { constants, predicates, functions }
) => {
  let factories = {
    variable: () => null,
    constant: () => null,
    functionApplication: (symbol, args, ee) => {
      checkArity(symbol, args, functions, ee);
      return null;
    },
    predicateAtom: (symbol, args, ee) => {
      checkArity(symbol, args, predicates, ee);
      return null;
    },
    equalityAtom: () => null,
    negation: () => null,
    conjunction: () => null,
    disjunction: () => null,
    implication: () => null,
    equivalence: () => null,
    existentialQuant: () => null,
    universalQuant: () => null
  };

  try {
    parseFormalization(
      formalization, constants, predicates, functions, factories
    );
  } catch (err) {
    console.error(err.message);
    return false;
  }

  return true;
};


/* functions for parsing */

function containsDuplicates(values) {
  let found = new Set();
  for (let x of values) {
    if (found.has(x)) {
      return true;
    } else {
      found.add(x);
    }
  }

  return false;
}

function containsClashes(constants, predicates, functions) {
  for (let x of constants) {
    if (predicates.has(x)) {
      return true;
    }
    if (functions.has(x)) {
      return true;
    }
  }

  for (let x of predicates.keys()) {
    if (functions.has(x)) {
      return true;
    }
  }

  return false;
}

function arrayToArityMap(symbols) {
  let arityMap = new Map();
  for (let x of symbols) {
    if (!arityMap.has(x.name)) {
      arityMap.set(x.name, x.arity);
    }
  }
  return arityMap;
}

function checkArity(symbol, args, arityMap, {expected}) {
  let a = arityMap.get(symbol);
  if (args.length !== a) {
    expected(`${a} argument${(a === 1 ? '' : 's')} to ${symbol}`);
  }
}

function parseFormalization(input, constants, predicates,
                            functions, factories) {
  const nonLogicalSymbols = new Set([
    ...constants,
    ...predicates.keys(),
    ...functions.keys()
  ]);

  const language = {
    isConstant: (x) => constants.has(x),
    isPredicate: (x) => predicates.has(x),
    isFunction: (x) => functions.has(x),
    isVariable: (x) => !nonLogicalSymbols.has(x)
  };

  return parseFormulaWithPrecedence(input, language, factories);
}

module.exports = {
  getLanguage,
  checkExercise,
  checkArity,
  parseFormalization
};
