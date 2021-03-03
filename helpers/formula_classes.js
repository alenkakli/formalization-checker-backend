
class Variable {
    constructor(symbol) {
        this.symbol = symbol;
    }
    toString() {
        return this.symbol;
    }
}

class Constant {
    constructor(symbol) {
        this.symbol = symbol;
    }
    toString() {
        return this.symbol;
    }
}

class FunctionApplication {
    constructor(symbol, args) {
        this.symbol = symbol;
        this.args = args;
    }
    toString() {
        const argsToString = this.args.map((x) => x.toString());
        return `${this.symbol}(${argsToString.join(',')})`;
    }
}

class PredicateAtom {
    constructor(symbol, args) {
        this.symbol = symbol;
        this.args = args;
    }
    toString() {
        const argsToString = this.args.map((x) => x.toString());
        return `${this.symbol}(${argsToString.join(',')})`;
    }
}

class EqualityAtom {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `(${this.lhs.toString()} = ${this.rhs.toString()})`;
    }
}

class Negation {
    constructor(subf) {
        this.subf = subf;
    }
    toString() {
        return `~(${this.subf.toString()})`;
    }
}

class Conjunction {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `(${this.lhs.toString()} & ${this.rhs.toString()})`;
    }
}

class Disjunction {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `(${this.lhs.toString()} | ${this.rhs.toString()})`;
    }
}

class Implication {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `(${this.lhs.toString()} => ${this.rhs.toString()})`;
    }
}

class Equivalence {
    constructor(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `(${this.lhs.toString()} <=> ${this.rhs.toString()})`;
    }
}

class ExistentialQuant {
    constructor(variable, subf) {
        this.variable = variable;
        this.subf = subf;
    }
    toString() {
        return `(? [${this.variable.toString()}] : ${this.subf.toString()})`;
    }
}

class UniversalQuant {
    constructor(variable, subf) {
        this.variable = variable;
        this.subf = subf;
    }
    toString() {
        return `(! [${this.variable.toString()}] : ${this.subf.toString()})`;
    }
}
