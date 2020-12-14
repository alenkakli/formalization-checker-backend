const db = require('./db');

const insertExercise = (language, propositions) => {
  db.run(
    `INSERT INTO exercises(constants, predicates, functions, proposition) VALUES(?,?,?,?)`,
    [
      data.constants,
      data.predicates,
      data.functions,
      data.proposition
    ],
    (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("A row has been inserted.");
    }
  );
};

const insertProposition = (exercise_id, proposition, formalizations) => {};

const insertFormalization = (proposition_id, formalization) => {};

module.exports = {
  insertExercise,
  insertProposition,
  insertFormalization
};
