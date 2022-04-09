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
module.exports = function evaluate(
  solution, helpSolution, formalizations, exercise, res, saveSolutionWithResult
) {
  const { constants, predicates, functions } = getLanguage(exercise);

  let language = new LanguageToVampire();
  let factories = getFactoriesForLanguage(language);

  solution = parseFormalization(
    solution, constants, predicates, functions, factories
  ).toVampire();

  if(helpSolution !== ""){
    helpSolution = parseFormalization(
        helpSolution, constants, predicates, functions, factories
    ).toVampire();
  }

  formalization = parseFormalization(
    formalizations[0].formalization,
    constants, predicates, functions, factories
  ).toVampire();
  evalWithVampire(res, solution, helpSolution,  formalization, saveSolutionWithResult, language, exercise);


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
      variable, language.variableToVampire(variable), null, subf
    ),
    universalQuant: (variable, subf) => new UniversalQuant(
      variable, language.variableToVampire(variable), null, subf
    )
  };
}
