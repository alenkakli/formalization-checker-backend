const {
  Variable,
  Constant,
  FunctionApplication,
  PredicateAtom,
  EqualityAtom,
  Negation,
  Conjunction,
  Disjunction,
  Implication,
  Equivalence,
  ExistentialQuant,
  UniversalQuant
} = require("./formula_classes");
const {checkArity, parseFormalization, getLanguage} = require("./checks");
const constants = require("constants");

class LanguageToVampire {
  constructor() {
    this.variablesToVampire = new Map();
    this.variablesToOriginal = new Map();

    this.constantsToVampire = new Map();
    this.constantsToOriginal = new Map();

    this.predicatesToVampire = new Map();
    this.predicatesToOriginal = new Map();

    this.functionsToVampire = new Map();
    this.functionsToOriginal = new Map();
  }

  variableToVampire(symbol) {
    return this.toVampire(
      symbol, 'V', this.variablesToVampire, this.variablesToOriginal
    );
  }

  constantToVampire(symbol) {
    return this.toVampire(
      symbol, 'c', this.constantsToVampire, this.constantsToOriginal
    );
  }

  predicateToVampire(symbol) {
    return this.toVampire(
      symbol, 'p', this.predicatesToVampire, this.predicatesToOriginal
    );
  }

  functionToVampire(symbol) {
    return this.toVampire(
      symbol, 'f', this.functionsToVampire, this.functionsToOriginal
    );
  }

  formulaToVampire(exercise) {
    const {constants, predicates, functions} = getLanguage(exercise);
    const factories = this.getFactoriesForLanguage();
    return ((formula) => parseFormalization(formula, constants, predicates, functions, factories, exercise.parserType).toVampire());
  }

  formulaToParsed(exercise) {
    const { constants, predicates, functions } = getLanguage(exercise);
    const factories = this.getFactoriesForLanguage();
    return (formula) => parseFormalization(formula, constants, predicates, functions, factories, exercise.parserType);
}

  getFactoriesForLanguage() {
    return {
      variable: (symbol) => new Variable(
          symbol, this.variableToVampire(symbol)
      ),
      constant: (symbol) => new Constant(
          symbol, this.constantToVampire(symbol)
      ),
      functionApplication: (symbol, args, ee) => {
        checkArity(symbol, args, functions, ee);
        return new FunctionApplication(
            symbol, this.functionToVampire(symbol), args
        );
      },
      predicateAtom: (symbol, args, ee) => {
        checkArity(symbol, args, predicates, ee);
        return new PredicateAtom(
            symbol, this.predicateToVampire(symbol), args
        );
      },
      equalityAtom: (lhs, rhs) => new EqualityAtom(lhs, rhs),
      negation: (subf) => new Negation(subf),
      conjunction: (lhs, rhs) => new Conjunction(lhs, rhs),
      disjunction: (lhs, rhs) => new Disjunction(lhs, rhs),
      implication: (lhs, rhs) => new Implication(lhs, rhs),
      equivalence: (lhs, rhs) => new Equivalence(lhs, rhs),
      existentialQuant: (variable, subf) => new ExistentialQuant(
          variable, this.variableToVampire(variable), null, subf
      ),
      universalQuant: (variable, subf) => new UniversalQuant(
          variable, this.variableToVampire(variable), null, subf
      )
    };
  }

  variableToHuman(vampireSymbol) {
    return this.toHuman(vampireSymbol, this.variablesToOriginal);
  }

  constantToHuman(vampireSymbol) {
    return this.toHuman(vampireSymbol, this.constantsToOriginal);
  }

  predicateToHuman(vampireSymbol) {
    return this.toHuman(vampireSymbol, this.predicatesToOriginal);
  }

  functionToHuman(vampireSymbol) {
    return this.toHuman(vampireSymbol, this.functionsToOriginal);
  }

  formulaToHuman(vampireFormula) {
    return vampireFormula.toHuman(this);
  }

  // only a private function, do not use anywhere else
  toVampire(symbol, prefix, mapToVampire, mapToOriginal) {
    if (mapToVampire.has(symbol)) {
      return mapToVampire.get(symbol);
    }
    const newSymbol = prefix + (mapToVampire.size + 1);
    mapToVampire.set(symbol, newSymbol);
    mapToOriginal.set(newSymbol, symbol);
    return newSymbol;
  }

  toHuman(vampireSymbol, mapToOriginal) {
    if (!mapToOriginal.has(vampireSymbol)) {
      throw new Error(`Unknown Vampire symbol: ${vampireSymbol}`);
    }
    return mapToOriginal.get(vampireSymbol);
  }
}

module.exports = {
  LanguageToVampire
}
