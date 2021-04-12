const {
  getLanguage, checkArity, parseFormalization
} = require('./checks');
const {
  Variable, Constant, FunctionApplication,
  PredicateAtom, EqualityAtom, Negation,
  Conjunction, Disjunction, Implication,
  Equivalence, ExistentialQuant, UniversalQuant
} = require('./formula_classes');
const LanguageToVampire = require('./language');
const evalWithVampire = require('./vampire');

module.exports = async function evaluate(solution, formalizations, exercise) {
  const { constants, predicates, functions } = getLanguage(exercise);

  if (formalizations.length === 0) {
    throw new Error('Exercise does not have any formalizations specified. Cannot evaluate.');
  }

  let language1 = new LanguageToVampire();
  let factories1 = getFactoriesForLanguage(language1);
  let language2 = new LanguageToVampire();
  let factories2 = getFactoriesForLanguage(language2);

  let solutionFormula = parseFormalization(
    solution, constants, predicates, functions, factories1
  );
  let formalizationFormula = parseFormalization(
    formalizations[0].formalization,
    constants, predicates, functions, factories2
  );

  let evaluation = await evalWithVampire(
    solutionFormula, formalizationFormula
  );
  return evaluation;
}

function getFactoriesForLanguage(language) {
  return {
    variable: (symbol) => new Variable(
      symbol, language.variableToVampire(symbol)
    ),
    constant: (symbol) => new Constant(
      symbol, language.constantToVampire(symbol)
    ),
    functionApplication: (symbol, args, ee) => {
      checkArity(symbol, args, functions, ee);
      return new FunctionApplication(
        symbol, language.functionToVampire(symbol), args
      );
    },
    predicateAtom: (symbol, args, ee) => {
      checkArity(symbol, args, predicates, ee);
      return new PredicateAtom(
        symbol, language.predicateToVampire(symbol), args
      );
    },
    equalityAtom: (lhs, rhs) => new EqualityAtom(lhs, rhs),
    negation: (subf) => new Negation(subf),
    conjunction: (lhs, rhs) => new Conjunction(lhs, rhs),
    disjunction: (lhs, rhs) => new Disjunction(lhs, rhs),
    implication: (lhs, rhs) => new Implication(lhs, rhs),
    equivalence: (lhs, rhs) => new Equivalence(lhs, rhs),
    existentialQuant: (variable, subf) => new ExistentialQuant(
      variable, language.variableToVampire(variable), subf
    ),
    universalQuant: (variable, subf) => new UniversalQuant(
      variable, language.variableToVampire(variable), subf
    )
  };
}
