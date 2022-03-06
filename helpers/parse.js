const { parseTff } = require('../../js-fol-parser');

function getStructure(structure){
    structure = structure.split(".");

    let constants = {};
    let predicates = {};
    let poc = 1;

    for(let i = 0; i < structure.length - 1; i++ ){
        if(structure[i] === "\n" ){
            continue;
        }
        let formula = structure[i] + ".";
        let parsed_formula = parseTff(formula, factories());
        if(parsed_formula.type === "type" || (!parsed_formula.name.includes("predicate") && !parsed_formula.name.includes("function")) ){
            continue;
        }
        let name = parsed_formula.name.slice(parsed_formula.name.search("_") + 1, parsed_formula.name.length);
        let pom;
        if(parsed_formula.name.includes("predicate")){
            pom = parsePredicate(parsed_formula, poc, predicates, constants, name);
        }

        if(parsed_formula.name.includes("function")){
            pom = parseFunction(parsed_formula, poc, predicates, constants, name);
        }
        predicates = pom.predicates;
        constants = pom.constants;
        poc = pom.poc;
    }
    return getStringDomainAndPredicates(predicates, constants);
}

function  parseFunction(parsed_formula, poc, predicates, constants, predicate){
    let cons = [];
    predicates[predicate] = [];
    if(parsed_formula.formula === "comment" || parsed_formula.formula === "c:"){
        return;
    }
    let formula = parsed_formula.formula;

    if(formula.includes("∧")){
        formula = formula.split("∧");
    }
    else{
        formula = [formula];
    }
    for(let i = 0; i < formula.length; i++){
        if(formula[i].includes("=")){
            formula[i] = formula[i].split("=");
        }
        let count = (formula[i][0].match(/\(/g) || []).length;
        if(count !== 1){
            formula[i][0] = formula[i][0].slice(1, formula[i][0].length);
        }
        count = (formula[i][0].match(/\)/g) || []).length;
        if(count !== 1){
            formula[i][0] = formula[i][0].slice(0, formula[i][0].length - 1);
        }
        if(formula[i][0] === "¬"){
            continue;
        }
        formula[i][0] = formula[i][0].slice(formula[i][0].indexOf("("), formula[i][0].indexOf(")"));
        let constant = [formula[i][0]];
        if(formula[i][0].includes(",")){
            constant = formula[i][0].split(",");
        }
        let pom = getConstantsFromPredicate(constant, constants, poc);
        constants = pom.constants;
        poc = pom.poc;
        formula[i][1] = formula[i][1].replaceAll(")", "");
        formula[i][1] = formula[i][1].replaceAll("(", "");
        formula[i][1] = formula[i][1].slice(formula[i][1].search(":") + 1, formula[i][1].length);
        if (!(formula[i][1] in constants)){
            constants[formula[i][1]] = poc;
            poc++;
        }

        let consta = [];
        for(let m = 0; m < constant.length; m++ ){
            consta.push(constants[constant[m]]);
        }
        consta.push(constants[formula[i][1]]);
        cons.push(consta);
    }
    predicates[predicate] = cons;

    return {constants: constants, poc: poc, predicates: predicates};
}


function parsePredicate(parsed_formula, poc, predicates, constants, predicate){
    let cons = [];
    predicates[predicate] = [];
    if(parsed_formula.formula === "comment" || parsed_formula.formula === "c:"){
        return {constants: constants, poc: poc, predicates: predicates};
    }
    let formula = parsed_formula.formula;

    if(formula.includes("∧")){
        formula = formula.split("∧");
    }
    else{
        formula = [formula];
    }
    for(let i = 0; i < formula.length; i++){
        let count = (formula[i].match(/\(/g) || []).length;
        if(count > 1){
            formula[i] = formula[i].slice(1, formula[i].length);
        }
        count = (formula[i].match(/\)/g) || []).length;
        if(count > 1){
            formula[i] = formula[i].slice(0, formula[i].length - 1);
        }
        if(formula[i][0] === "¬"){
            continue;
        }
        formula[i] = formula[i].slice(formula[i].indexOf("("), formula[i].indexOf(")"));
        let constant = [formula[i]];
        if(formula[i].includes(",")){
            constant = formula[i].split(",");
        }
        let pom = getConstantsFromPredicate(constant, constants, poc);
        constants = pom.constants;
        poc = pom.poc;
        console.log(constants);
        let consta = [];
        for(let m = 0; m < constant.length; m++ ){
            consta.push(constants[constant[m]]);
        }
        cons.push(consta);

    }
    predicates[predicate] = cons;
    return {constants: constants, poc: poc, predicates: predicates};
}

function getConstantsFromPredicate(constant, constants, poc){
    for(let j = 0; j < constant.length; j++){
        constant[j] = constant[j].slice(constant[j].search(":") + 1, constant[j].length);
        if(constant[j] in constants){
            continue;
        }
        constants[constant[j]] = poc;
        poc++;
    }
    return {constants: constants, poc: poc};
}

function getStringDomainAndPredicates(predicates, constants){
    let d = "D= { ";
    let p = "";
    for (const [key, value] of Object.entries(predicates)) {  //ak su v jazyku konstanty pripradit im prvok domeny
        p += "i(" + key + ") = " + "{";
        if (value[value.length - 1] === undefined) {
            p += "}\n ";
            continue;
        }
        for (let j = 0; j < value.length - 1; j++) {
            if (value[j] === undefined) {
                continue;
            }
            p += "(" + value[j] + ")";
        }
        p += "(" +  value[value.length - 1] + ")}\n "; //jeden / posledny prvok
    }
    for (const [key, value] of Object.entries(constants)){
        d += value + " ,";
    }
    d = d.slice(0, d.length -1 );
    d += "}\n ";
    return {domain: d, predicates: p};
}

function factories(){
    const application = (sym, args, _) => `${sym}(${args.join(',')})`
    return{
        variable: (v, _) => `v:${v}`,
        constant: (c, _) => `c:${c}`,
        functionApplication: application,
        predicateAtom: application,
        equalityAtom: (lhs, rhs, _) => `${lhs}=${rhs}`,
        negation: (f, _) => `¬${f}`,
        conjunction: (lhs, rhs, _) => `(${lhs}∧${rhs})`,
        disjunction: (lhs, rhs, _) => `(${lhs}∨${rhs})`,
        implication: (lhs, rhs, _) => `(${lhs}→${rhs})`,
        equivalence: (lhs, rhs, _) => `(${lhs}↔︎${rhs})`,
        existentialQuant: (v, f, _) => `∃${v} ${f}`,
        universalQuant: (v, f, _) => `∀${v} ${f}`,
    }
}

module.exports = {
    getStructure
}
