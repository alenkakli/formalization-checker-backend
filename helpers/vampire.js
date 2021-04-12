const { exec } = require('child_process');

const pathToVampire = './vampire_rel_master_4999';

module.exports = async function evalWithVampire(callback, axiom, conjecture, timeLimit = 10) {
  let input = `fof(a,axiom,${axiom.toVampire()}). `
            + `fof(b,conjecture,${conjecture.toVampire()}).`;
  
  let process = await exec(`${pathToVampire} -sa fmb -t ${timeLimit}`);
  process.stdin.write(input);
  process.stdin.end();

  return '';
};
