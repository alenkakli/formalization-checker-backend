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
const {vampire, evalWithVampire} = require('./vampire');

module.exports = async function evaluate(
    solution, formalizations, exercise
) {

  let {constants, predicates, functions, constraint} = getLanguage(exercise);

  let language = new LanguageToVampire();
  let factories = getFactoriesForLanguage(language);

  solution = parseFormalization(
      solution, constants, predicates, functions, factories
  ).toVampire();

  if (constraint !== undefined && constraint !== '') {
    constraint = parseFormalization(
        constraint, constants, predicates, functions, factories
    ).toVampire();
  }

  let constraintFromProp = formalizations[0].constraints;
  if (constraintFromProp !== undefined && constraintFromProp !== '') {
    constraintFromProp = parseFormalization(
        constraintFromProp, constants, predicates, functions, factories
    ).toVampire();
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
    formalization = parseFormalization(
        formalizations[i].formalization,
        constants, predicates, functions, factories
    ).toVampire();
    eval_status.solutionToFormalization = await vampire(solution, formalization, 10);
    eval_status.formalizationToSolution = await vampire(formalization, solution, 10);
    if (eval_status.formalizationToSolution === "OK" && eval_status.solutionToFormalization === "OK") {
      return eval_status;
    }
  }

  // call first saved formalization in case solution is not correct with none of saved solution
  formalization = parseFormalization(
      formalizations[0].formalization,
      constants, predicates, functions, factories
  ).toVampire();

  return evalWithVampire(solution, constraint, constraintFromProp,  formalization, language, exercise);


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
