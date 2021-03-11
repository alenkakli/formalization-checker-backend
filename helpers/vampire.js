const { execSync } = require('child_process');

const pathToVampire = './vampire_rel_master_4999';

module.exports = function evalWithVampire(axiom, conjecture, timeLimit = 10) {7
  axiom = axiom.toVampire();
  conjecture = conjecture.toVampire();
  let input = `fof(a,axiom,${axiom}). fof(b,conjecture,${conjecture}).`;
  return execSync(
    `${pathToVampire} -sa fmb -t ${timeLimit}`,
    { input }
  ).toString();
}
