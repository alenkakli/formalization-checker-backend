const {
  parseConstants,
  parsePredicates,
  parseFunctions,
  parseFormulaWithPrecedence
} = require('@fmfi-uk-1-ain-412/js-fol-parser');

const checkExercise = (exercise) => {
  if (!('title' in exercise) || !('description' in exercise)
      || !('constants' in exercise) || !('predicates' in exercise)
      || !('functions' in exercise) || !('propositions' in exercise)) {
    return false;
  }

  let constants = null;
  let predicates = null;
  let functions = null;
  try {
    constants = parseConstants(exercise.constants);
    predicates = parsePredicates(exercise.predicates);
    functions = parseFunctions(exercise.functions);
  } catch (err) {
    return false;
  }

  if (containsDuplicates(constants)
      || containsDuplicates(predicates.map(x => x.name))
      || containsDuplicates(functions.map(x => x.name))) {
    return false;
  }

  constants = new Set(constants);
  predicates = arrayToArityMap(predicates);
  functions = arrayToArityMap(functions);

  if (containsClashes(constants, predicates, functions)) {
    return false;
  }

  const language = { constants, predicates, functions };

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
  try {
    parseFormalization(
      formalization, constants, predicates, functions,
      parseFormulaWithPrecedence
    );
  } catch (err) {
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
  const a = arityMap.get(symbol);
  if (args.length !== a) {
    expected(`${a} argument${(a === 1 ? '' : 's')} to ${symbol}`);
  }
}

function parseFormalization(input, constants, predicates, functions, parser) {
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

  const factories = {
    variable: () => null,
    constant: () => null,
    functionApplication: (symbol, args, ee) => {
      checkArity(symbol, args, functions, ee);
    },
    predicateAtom: (symbol, args, ee) => {
      checkArity(symbol, args, predicates, ee);
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

  parser(input, language, factories);
}

module.exports = {
  checkExercise
};
