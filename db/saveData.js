const pool = require('./db');

const saveExercise = async (constants, predicates, functions, propositions) => {
  /* argument propositions is an array of objects:
   * { proposition: (string), formalizations: (array) }
   */
  try {
    const queryText =
      "INSERT INTO exercises(constants, predicates, functions) "
      + "VALUES($1, $2, $3) RETURNING exercise_id";
    const res = await pool.query(
      queryText,
      [ constants, predicates, functions ]
    );

    const exercise_id = res.rows[0].exercise_id;

    propositions.forEach(p => {
      const { proposition, formalizations } = p;
      saveProposition(exercise_id, proposition, formalizations);
    });
  } catch (err) {
    console.error(err.stack);
  }
};

const saveProposition = async (exercise_id, proposition, formalizations) => {
  try {
    const queryText =
      "INSERT INTO propositions(proposition, exercise_id) "
      + "VALUES($1, $2) RETURNING proposition_id";
    const res = await pool.query(
      queryText,
      [ proposition, exercise_id ]
    );

    const proposition_id = res.rows[0].proposition_id;

    formalizations.forEach(f => {
      saveFormalization(proposition_id, f);
    });
  } catch (err) {
    console.error(err.stack);
  }
};

const saveFormalization = async (proposition_id, formalization) => {
  try {
    const queryText =
      "INSERT INTO formalizations(formalization, proposition_id) "
      + "VALUES($1, $2)";
    await pool.query(
      queryText,
      [ formalization, proposition_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

module.exports = {
  saveExercise,
  saveProposition,
  saveFormalization
};
