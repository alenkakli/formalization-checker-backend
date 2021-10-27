
class Variable {
  constructor(originalSymbol, vampireSymbol) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
  }

  toVampire() {
    return this.vampireSymbol;
  }
}

class Constant {
  constructor(originalSymbol, vampireSymbol) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
  }

  toVampire() {
    return this.vampireSymbol;
  }
}

class FunctionApplication {
  constructor(originalSymbol, vampireSymbol, args) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.args = args;
  }

  toVampire() {
    const argsToString = this.args.map((x) => x.toVampire());
    return `${this.vampireSymbol}(${argsToString.join(',')})`;
  }
}

class PredicateAtom {
  constructor(originalSymbol, vampireSymbol, args) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.args = args;
  }

  toVampire() {
    const argsToString = this.args.map((x) => x.toVampire());
    return `${this.vampireSymbol}(${argsToString.join(',')})`;
  }
}

class EqualityAtom {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toVampire() {
    return `(${this.lhs.toVampire()} = ${this.rhs.toVampire()})`;
  }
}

class Negation {
  constructor(subf) {
    this.subf = subf;
  }

  toVampire() {
    return `~(${this.subf.toVampire()})`;
  }
}

class Conjunction {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toVampire() {
    return `(${this.lhs.toVampire()} & ${this.rhs.toVampire()})`;
  }
}

class Disjunction {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toVampire() {
    return `(${this.lhs.toVampire()} | ${this.rhs.toVampire()})`;
  }
}

class Implication {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toVampire() {
    return `(${this.lhs.toVampire()} => ${this.rhs.toVampire()})`;
  }
}

class Equivalence {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }

  toVampire() {
    return `(${this.lhs.toVampire()} <=> ${this.rhs.toVampire()})`;
  }
}

class ExistentialQuant {
  constructor(originalSymbol, vampireSymbol, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
  }

  toVampire() {
    return `(? [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }
}

class UniversalQuant {
  constructor(originalSymbol, vampireSymbol, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
  }

  toVampire() {
    return `(! [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }
}

module.exports = {
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
};
