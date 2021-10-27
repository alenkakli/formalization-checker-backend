
module.exports = class LanguageToVampire {
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
}
