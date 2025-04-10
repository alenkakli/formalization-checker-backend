
class Variable {
  constructor(originalSymbol, vampireSymbol) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
  }

  toVampire() {
    return this.vampireSymbol;
  }

  toHuman() {
    return this.originalSymbol;
  }

  getAll() {
    return this;
  }

  evaluate(structure, valuation) {
    const result = valuation[this.originalSymbol];
    return { kind: "variable", symbol: this.originalSymbol, result };
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

  toHuman() {
    return this.originalSymbol !== undefined ? this.originalSymbol : this.vampireSymbol;
  }

  getAll() {
    return [this];
  }

  evaluate(structure, valuation) {
    const result = structure.iC[this.originalSymbol];
    return { kind: "constant", symbol: this.originalSymbol, result };
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

  toHuman() {
    return this.originalSymbol;
  }

  getArgs() {
    return this.args;
  }

  getAll() {
    return [this];
  }

  evaluate(structure, valuation) {
    const evaluatedArgs = this.args.map(arg => arg.evaluate(structure, valuation));

    const evaluatedArgsResults = evaluatedArgs.map(arg => arg.result);
    const functionTuples = structure.iF[this.originalSymbol];

    let result = undefined;
    for (const tuple of functionTuples) {
        if (JSON.stringify(tuple.slice(0, -1)) === JSON.stringify(evaluatedArgsResults)) {
            result = tuple[tuple.length - 1];
            break;
        }
    }

    return {
      kind: "functionApplication",
      symbol: this.originalSymbol,
      args: evaluatedArgs,
      result
    };
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

  toHuman() {
    return this.originalSymbol;
  }

  getArgs() {
    return this.args;
  }

  getAll() {
    return [this];
  }

  evaluate(structure, valuation) {
    const evaluateArgs = this.args.map(arg => arg.evaluate(structure, valuation));

    const evaluatedArgsResults = evaluateArgs.map(arg => arg.result);
    const predicateSet = structure.iP[this.originalSymbol];
    const result = predicateSet.some(tuple => JSON.stringify(tuple) === JSON.stringify(evaluatedArgsResults));

    return {
      kind: "predicate",
      symbol: this.originalSymbol,
      args: evaluateArgs,
      result
    };
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

  toHuman() {
    return `(${this.lhs.toHuman()} = ${this.rhs.toHuman()})`;
  }

  getAll() {
    let zoz = [];
    let a = this.lhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    return zoz;
  }

  evaluate(structure, valuation) {
    const lhsEval = this.lhs.evaluate(structure, valuation);
    const rhsEval = this.rhs.evaluate(structure, valuation);
    const result = lhsEval.result === rhsEval.result;

    return {
      kind: "equality",
      symbol: "=",
      args: [lhsEval, rhsEval],
      result
    };
  }
}

class Negation {
  constructor(subf) {
    this.subf = subf;
  }

  toVampire() {
    return `~(${this.subf.toVampire()})`;
  }

  toHuman() {
    return `¬(${this.subf.toHuman()})`;
  }

  getAll() {
    return [];
  }

  evaluate(structure, valuation) {
    const subEval = this.subf.evaluate(structure, valuation);
    const result = !subEval.result;

    return {
      kind: "negation",
      symbol: "¬",
      args: [subEval],
      result
    };
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

  toHuman() {
    return `(${this.lhs.toHuman()} ∧ ${this.rhs.toHuman()})`;
  }

  getAll() {
    let zoz = [];
    let a = this.lhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    return zoz;
  }

  evaluate(structure, valuation) {
    const leftEval = this.lhs.evaluate(structure, valuation);
    if (leftEval.result) {
      const rightEval = this.rhs.evaluate(structure, valuation);
      const result = rightEval.result;

      return {
        kind: "conjunction",
        symbol: "∧",
        args: [leftEval, rightEval],
        result
      };
    } else {
      const result = false;
      return {
        kind: "conjunction",
        symbol: "∧",
        args: [leftEval],
        result
      };
    }
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

  toHuman() {
    return `(${this.lhs.toHuman()} ∨ ${this.rhs.toHuman()})`;
  }

  getAll() {
    let zoz = [];
    let a = this.lhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll();
    for (let pom = 0; pom < a.length; pom++) {
      zoz.push(a[pom]);
    }
    return zoz;
  }

  evaluate(structure, valuation) {
    const leftEval = this.lhs.evaluate(structure, valuation);
    if (!leftEval.result) {
      const rightEval = this.rhs.evaluate(structure, valuation);
      const result = rightEval.result;

      return {
        kind: "disjunction",
        symbol: "∨",
        args: [leftEval, rightEval],
        result
      };
    } else {
      const result = true;
      return {
        kind: "disjunction",
        symbol: "∨",
        args: [leftEval],
        result
      };
    }
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

  toHuman() {
    return `(${this.lhs.toHuman()} → ${this.rhs.toHuman()})`;
  }

  evaluate(structure, valuation) {
    const leftEval = this.lhs.evaluate(structure, valuation);
    if (leftEval.result) {
      const rightEval = this.rhs.evaluate(structure, valuation);
      const result = !leftEval.result || rightEval.result;

      return {
      kind: "implication",
      symbol: "→",
      args: [leftEval, rightEval],
      result
      };
    } else {
      const result = true;
      return {
        kind: "implication",
        symbol: "→",
        args: [leftEval],
        result
      };
    }
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

  toHuman() {
    return `(${this.lhs.toHuman()} ↔ ${this.rhs.toHuman()})`;
  }

  evaluate(structure, valuation) {
    const leftEval = this.lhs.evaluate(structure, valuation);
    const rightEval = this.rhs.evaluate(structure, valuation);

    const result = leftEval.result === rightEval.result; 
    return {
      kind: "equivalence",
      symbol: "↔",
      args: [leftEval, rightEval],
      result
    };
  }

}

class ExistentialQuant {
  constructor(originalSymbol, vampireSymbol, type, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
    this.type = type === null ? "" : type;
  }

  toVampire() {
    return `(? [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }

  toHuman() {
    return `∃${this.originalSymbol} (${this.subf.toHuman()})`;
  }

  evaluate(structure, valuation) {
    let allResults = [];
    for (let element of structure.domain) {
      const newValuation = { ...valuation, [this.originalSymbol]: element };
      const subEval = this.subf.evaluate(structure, newValuation);
      allResults.push(subEval);
      if (subEval.result) {
        return {
          kind: "existentialQuant",
          symbol: "∃",
          variable: this.originalSymbol,
          args: [subEval],
          result: true
        };
      }
    }
    return {
      kind: "existentialQuant",
      symbol: "∃",
      variable: this.originalSymbol,
      args: allResults,
      result: false
    };
  }
}

class UniversalQuant {
  constructor(originalSymbol, vampireSymbol, type, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
    this.type = type === null ? "" : type;
  }

  toVampire() {
    return `(! [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }

  toHuman() {
    return `∀${this.originalSymbol} (${this.subf.toHuman()})`;
  }

  getType() {
    return this.type;
  }

  evaluate(structure, valuation) {
    let allResults = [];
    for (let element of structure.domain) {
      const newValuation = { ...valuation, [this.originalSymbol]: element };
      const subEval = this.subf.evaluate(structure, newValuation);
      allResults.push(subEval);
      if (!subEval.result) {
        return {
          kind: "universalQuant",
          symbol: "∀",
          variable: this.originalSymbol,
          args: [subEval],
          result: false
        };
      }
    }
    return {
      kind: "universalQuant",
      symbol: "∀",
      variable: this.originalSymbol,
      args: allResults,
      result: true
    };
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
