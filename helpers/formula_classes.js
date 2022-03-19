
class Variable {
  constructor(originalSymbol, vampireSymbol) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
  }

  toVampire() {
    return this.vampireSymbol;
  }

  getOriginalSymbol(){
    return this.originalSymbol;
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

  getOriginalSymbol(){
    if(this.originalSymbol !== undefined){
      return this.originalSymbol;
    }
    return this.vampireSymbol;
  }
  getAll(){
    return [this];
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

  getSymbol(){
    return this.originalSymbol;
  }

  getArgs(){
    return this.args;
  }

  getAll() {
    return [this];
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

  getSymbol(){
    return this.originalSymbol;
  }

  getArgs(){
    return this.args;
  }

  getAll() {
    return [this];
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
  getAll(){
    let zoz = []
    let a = this.lhs.getAll();
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll()
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
    return zoz;
  }
}

class Negation {
  constructor(subf) {
    this.subf = subf;
  }

  toVampire() {
    return `~(${this.subf.toVampire()})`;
  }

  getAll() {
    return [];
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

  getAll(){
    let zoz = []
    let a = this.lhs.getAll();
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll()
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
      return zoz;
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
  getAll(){
    let zoz = []
    let a = this.lhs.getAll();
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
    a = this.rhs.getAll()
    for(let pom = 0; pom < a.length; pom++){
      zoz.push(a[pom]);
    }
    return zoz;
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
  constructor(originalSymbol, vampireSymbol, type, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
    if(type === null){
      this.type = "";
    }
    else{
      this.type = type;
    }
  }

  toVampire() {
    return `(? [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }
}

class UniversalQuant {
  constructor(originalSymbol, vampireSymbol, type, subf) {
    this.originalSymbol = originalSymbol;
    this.vampireSymbol = vampireSymbol;
    this.subf = subf;
    if(type === null){
      this.type = "";
    }
    else{
      this.type = type;
    }
  }

  toVampire() {
    return `(! [${this.vampireSymbol}] : ${this.subf.toVampire()})`;
  }

  getType() {
      return this.type;
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
