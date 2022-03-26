const { parseTff } = require('../../js-fol-parser');
var chance = require('chance').Chance();
const {
    getLanguage
} = require('./checks');
const {Variable, Constant, FunctionApplication, PredicateAtom,
    EqualityAtom, Negation, Conjunction, Disjunction, Implication,
    Equivalence, ExistentialQuant, UniversalQuant} = require('./formula_classes');
const constants = require("constants");

function getStructure(structure, language, exercise){
    structure = structure.split(".");
    let constants = {}
    let predicates = {};
    let functions = {};
    let poc = 1;

    getLanguage(exercise).constants.forEach(key => constants[key] = poc);
    poc++;
    getLanguage(exercise).predicates.forEach((key, value) => predicates[value] = []);
    getLanguage(exercise).functions.forEach((key, value) => functions[value] = []);

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
            if(parsed_formula.formula.constructor.name === "Conjunction"){
                poc = parsePredicate(parsed_formula, poc, predicates, constants).poc;
            }
        }
        if(parsed_formula.name.includes("function")){
            let functionAplications ;
            if(parsed_formula.formula.constructor.name === "Conjunction"){
                functionAplications = parsed_formula.formula.getAll()
            }
            else if (parsed_formula.formula.constructor.name === "FunctionApplication"){
                functionAplications = [parsed_formula.formula];
            }
            poc =  parseFunction(parsed_formula, poc, functions, constants,functionAplications).poc;
        }
        if(parsed_formula.name.includes("definition")){
            let constant ;
                if(parsed_formula.formula.constructor.name === "Conjuction") {
                    constant = parsed_formula.formula.getAll()
                }
                if(parsed_formula.formula.constructor.name === "Disjunction") {
                    constant = parsed_formula.formula.getAll()
                }
                if (parsed_formula.formula.constructor.name === "EqualityAtom") {
                    constant = parsed_formula.formula.getAll()
                } else {
                    constant = [parsed_formula.formula];
                }
                for (let i = 0; i < constant.length; i += 2) {
                    poc = parseEqualityAtom(constant[i], constant[i + 1], constants, poc).poc;
                }

        }
        if(parsed_formula.name.includes("finite_domain")){
            if(parsed_formula.formula.constructor.name === "UniversalQuant"){
                if(parsed_formula.formula.type === "i"){
                    poc = parseUniQuant(parsed_formula, poc, predicates, constants).poc;
                }
            }
        }
    }
    for(let [key, value] of Object.entries(functions)){
        poc = fillFunction(functions, constants, key, poc).poc;
    }
    return getStringDomainAndPredicates(predicates, constants, functions, exercise);

}

function parseFunction(parsed_formula, poc, functions, constants, functionApplications){
    for(let i = 0; i < functionApplications.length; i++){
        let args = functionApplications[i].getArgs();
        let constant = [];
        for(let j = 0; j < args.length; j++) {
            if(args[j].constructor.name !== "Array"){
                args[j] = [args[j]];
            }
            for(let m = 0; m < args[j].length; m++ ){
                poc = parseConstants(args[j][m], constants, poc).poc;
                if(args[j][m].getOriginalSymbol() === undefined){
                    constant.push(constants[args[j][m].toVampire()]);
                }
                else {
                    constant.push(constants[args[j][m].getOriginalSymbol()]);
                }
            }
        }
        functions[functionApplications[i].getSymbol()].push( constant);
    }
    return{functions: functions, constants: constants, poc: poc};
}

function parsePredicate(parsed_formula, poc, predicates, constants){
    let res = parsed_formula.formula.getAll();
    for(let i = 0; i < res.length; i++){
        let args = res[i].getArgs();
        let constant = [];
        for(let j = 0; j < args.length; j++) {
            poc = parseConstants(args[j], constants, poc).poc;
            if(args[j].getOriginalSymbol() === undefined){
                constant.push(constants[args[j].toVampire()]);
            }
            else {
                constant.push(constants[args[j].getOriginalSymbol()]);
            }
        }
        predicates[res[i].getSymbol()].push(constant);
    }
    return{predicates: predicates, constants: constants, poc: poc};
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
    if(constant.getOriginalSymbol() === ''){
        return { constants: constants, poc: poc};
    }
    for(const key in constants){
        if(key === constant.getOriginalSymbol() || key === constant.toVampire()){
            return { constants: constants, poc: poc};
        }
    }
    if(constant.getOriginalSymbol() === undefined){
        constants[constant.toVampire()] = poc;
    }
    else {
        constants[constant.getOriginalSymbol()] = poc;
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

function fillFunction(functions, constants, fun, poc) {
    let was = []
    for (let value of functions[fun]) {
        was.push(value[0])
    }
    for (let key in constants) {
        if (!(was.includes(constants[key]))){
            was.push(constants[key]);
            functions[fun].push([constants[key], chance.integer({min: 1, max: poc - 1})]);
        }
    }
    return {constants: constants, poc: poc, functions: functions};
}

function getStringDomainAndPredicates(predicates, constants, functions, exercise){
    let d = "𝒟 = {";
    let m = "𝓜 = (𝒟, 𝑖)";
    let i = "";
    let poc = 0;
    for (let [key, value] of Object.entries(constants)){
        if(getLanguage(exercise).constants.has(key)) {
            i += "𝑖(" + key + ") = " + value + "\n";
        }
        if( value <= poc){
            continue;
        }
        d += value + ", ";
        poc++;
    }
    i += "\n";
    d = d.slice(0, d.length -2 );
    d += "}\n";

    i += stringForPredicateAndFunctions(predicates);
    i += stringForPredicateAndFunctions(functions);
    return {domain: d, prvky: i, m: m};
}

function stringForPredicateAndFunctions(name){
    let p = "";
    for (let [key, value] of Object.entries(name)) {
        p += "𝑖(" + key + ") = " + "{";
        if (value[value.length - 1] === undefined) {
            p += "}\n";
            continue;
        }
        for (let j = 0; j < value.length - 1; j++) {
            if (value[j] === undefined) {
                continue;
            }
            p += "(" + value[j] + "), ";
        }
        p += "(" +  value[value.length - 1] + ")}\n";
    }

    return p;
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
