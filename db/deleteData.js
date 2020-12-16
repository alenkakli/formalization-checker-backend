const pool = require('./db');

const deleteExercise = (exercise_id) => {
  try {
    const queryText =
      "DELETE FROM exercises WHERE exercise_id = $1";
    await pool.query(
      queryText,
      [ exercise_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const deleteProposition = (proposition_id) => {
  try {
    const queryText =
      "DELETE FROM propositions WHERE proposition_id = $1";
    await pool.query(
      queryText,
      [ proposition_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const deleteFormalization = (formalization_id) => {
  try {
    const queryText =
      "DELETE FROM formalizations WHERE formalization_id = $1";
    await pool.query(
      queryText,
      [ formalization_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

module.exports = {
  deleteExercise,
  deleteProposition,
  deleteFormalization
};
