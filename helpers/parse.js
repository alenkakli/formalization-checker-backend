const { parseTff } = require("@fmfi-uk-1-ain-412/js-fol-parser");
var chance = require('chance').Chance();
const {
    getLanguage
} = require('./checks');
const {Variable, Constant, FunctionApplication, PredicateAtom,
    EqualityAtom, Negation, Conjunction, Disjunction, Implication,
    Equivalence, ExistentialQuant, UniversalQuant} = require('./formula_classes');

function getStructure(structure, language, exercise){
    structure = structure.split(".");
    let constants = {}
    let symbols = { predicates: {}, functions: {} };
    let poc = 1;

    getLanguage(exercise).constants.forEach(key => { constants[key] = poc;
                                                                poc++;
                                                            });


    for(let i = 0; i < structure.length - 1; i++ ){
        if(structure[i] === "\n" ){
            continue;
        }
        let parsed_formula = parseTff(structure[i] + ".", factories(language.constantsToOriginal, language.variablesToOriginal,
            language.functionsToOriginal, language.predicatesToOriginal ));
        if(parsed_formula.type === "type"){
            continue;
        }

        if(parsed_formula.name.includes("predicate")){
            if(parsed_formula.formula instanceof Conjunction){
                poc = parsePredicate(parsed_formula, poc, symbols, constants).poc;
            }
            else if(parsed_formula.formula instanceof PredicateAtom){
                poc = parsePredicate(parsed_formula, poc, symbols, constants).poc;
            }
            else{
                let symbol = language.predicatesToOriginal.get(parsed_formula.name.substr(
                    parsed_formula.name.indexOf("_") + 1 ,parsed_formula.name.length ));
                symbols.predicates[symbol] = [];
            }

        }
        if(parsed_formula.name.includes("function")){
            let functionAplications ;
            if(parsed_formula.formula instanceof Conjunction){
                functionAplications = parsed_formula.formula.getAll()
            }
            else if (parsed_formula.formula instanceof FunctionApplication){
                functionAplications = parsed_formula.formula.getAll();
            }
            poc =  parseFunction(parsed_formula, poc, symbols, constants,functionAplications).poc;
        }
        if(parsed_formula.name.includes("definition")){
            let constant ;
                if(parsed_formula.formula instanceof Conjunction) {
                    constant = parsed_formula.formula.getAll()
                }
                if(parsed_formula.formula instanceof Disjunction) {
                    constant = parsed_formula.formula.getAll()
                }
                if (parsed_formula.formula instanceof EqualityAtom) {
                    constant = parsed_formula.formula.getAll()
                } else {
                    constant = [parsed_formula.formula];
                }
                for (let i = 0; i < constant.length; i += 2) {
                    poc = parseEqualityAtom(constant[i], constant[i + 1], constants, poc).poc;
                }

        }
        if(parsed_formula.name.includes("finite_domain")){
            if(parsed_formula.formula instanceof UniversalQuant){
                if(parsed_formula.formula.type === "i"){
                    poc = parseUniQuant(parsed_formula, poc, symbols, constants).poc;
                }
            }
        }
    }
    getLanguage(exercise).predicates.forEach((key, value) => {
        if(symbols.predicates[value] === undefined) {
            symbols.predicates[value] = []
        }
    });
    getLanguage(exercise).functions.forEach((key, value) => {
        if(symbols.functions[value] === undefined) {
            symbols.functions[value] = []
        }
    });
    for(let [key, value] of Object.entries(symbols.functions)){
        if(getLanguage(exercise).functions.has(key)){
            poc = fillFunction(symbols, constants, key, poc).poc;
        }
    }
    return {constants: constants, symbols: symbols, language:getLanguage(exercise)};

}

function parseFunction(parsed_formula, poc, symbols, constants, functionApplications){
    for(let i = 0; i < functionApplications.length; i++){
        let args = functionApplications[i].getArgs();
        let constant = [];
        for(let j = 0; j < args.length; j++) {
            if(args[j].constructor.name !== "Array"){
                args[j] = [args[j]];
            }
            for(let m = 0; m < args[j].length; m++ ){
                poc = parseConstants(args[j][m], constants, poc).poc;
                if(args[j][m].toHuman() === undefined){
                    constant.push(constants[args[j][m].toVampire()]);
                }
                else {
                    constant.push(constants[args[j][m].toHuman()]);
                }
            }
        }
        if(symbols[functionApplications[i].toHuman()] !== undefined){
            symbols.functions[functionApplications[i].toHuman()].push( constant);
        }
        else{
            symbols.functions[functionApplications[i].toHuman()] = [constant];
        }

    }
    return{symbols: symbols, constants: constants, poc: poc};
}

function parsePredicate(parsed_formula, poc, symbols, constants){
    let res = parsed_formula.formula.getAll();
    for(let i = 0; i < res.length; i++){
        let args = res[i].getArgs();
        let constant = [];
        for(let j = 0; j < args.length; j++) {
            poc = parseConstants(args[j], constants, poc).poc;
            if(args[j].toHuman() === undefined){
                constant.push(constants[args[j].toVampire()]);
            }
            else {
                constant.push(constants[args[j].toHuman()]);
            }
        }
        if(symbols.predicates[res[i].toHuman()] !== undefined){
            symbols.predicates[res[i].toHuman()].push( constant);
        }
        else{
            symbols.predicates[res[i].toHuman()] = [constant];
        }
    }
    return{symbols: symbols, constants: constants, poc: poc};
}

function parseUniQuant(parsed_formula, poc, predicates, constants){
    let domain = parsed_formula.formula.subf.getAll();
    for(let i = 0; i < domain.length; i++){
       if(domain[i].vampireSymbol === "X"){
           continue;
       }
       poc = parseConstants(domain[i], constants, poc).poc;
    }
    return{ constants: constants, poc: poc};
}

function parseConstants(constant, constants, poc){
    if(constant.toHuman() === ''){
        return { constants: constants, poc: poc};
    }
    for(const key in constants){
        if(key === constant.toHuman() || key === constant.toVampire()){
            return { constants: constants, poc: poc};
        }
    }
    if(constant.toHuman() === undefined){
        constants[constant.toVampire()] = poc;
    }
    else {
        constants[constant.toHuman()] = poc;
    }
    poc++;
    return{ constants: constants, poc: poc};
}

function parseEqualityAtom(constant1, constant2, constants, poc){
    if(constants[constant2] !== constants[constant1]){
        if(constants[constant2] < constants[constant1]){
            constants[constant1] = constants[constant2];
        }
        else{
            constants[constant2] = constants[constant1];
        }
    }
    return{ constants: constants, poc: poc};
}

function fillFunction(symbols, constants, fun, poc) {
    let was = []
    for (let value of symbols.functions[fun]) {
        was.push(value[0])
    }
    for (let key in constants) {
        if (!(was.includes(constants[key]))){
            was.push(constants[key]);
            symbols.functions[fun].push([constants[key], chance.integer({min: 1, max: poc - 1})]);
        }
    }
    return {constants: constants, poc: poc, symbols: symbols};
}


function factories(mapConstant, mapVariable, mapFunction, mapPredicate){
    return{
        variable: (v, _) => new Variable(mapVariable.get(v) , v),
        constant: (c, _) => new Constant(mapConstant.get(c), c),
        functionApplication:  (symbol, args, ee) => new FunctionApplication(mapFunction.get(symbol), symbol, args),
        predicateAtom: (symbol, args, ee) => new PredicateAtom(mapPredicate.get(symbol), symbol, args),
        equalityAtom: (lhs, rhs, _) => new EqualityAtom(lhs, rhs),
        negation: (f, _) => new Negation(f),
        conjunction: (lhs, rhs, _) => new Conjunction(lhs, rhs),
        disjunction: (lhs, rhs, _) => new Disjunction(lhs, rhs),
        implication: (lhs, rhs, _) => new Implication(lhs, rhs),
        equivalence: (lhs, rhs, _) => new Equivalence(lhs, rhs),
        existentialQuant: (v, f, _) => new ExistentialQuant(mapVariable.get(v), v, f),
        universalQuant: (v, type, f, _) => new UniversalQuant(mapVariable.get(v), v, type, f),
    }
}

module.exports = {
    getStructure
}
