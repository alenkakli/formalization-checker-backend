const pool = require('./db');

const updateConstants = async (exercise_id, constants) => {
  try {
    const queryText =
      "UPDATE exercises SET constants = $1 WHERE exercise_id = $2";
    await pool.query(
      queryText,
      [ constants, exercise_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const updatePredicates = async (exercise_id, predicates) => {
  try {
    const queryText =
      "UPDATE exercises SET predicates = $1 WHERE exercise_id = $2";
    await pool.query(
      queryText,
      [ predicates, exercise_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const updateFunctions = async (exercise_id, functions) => {
  try {
    const queryText =
      "UPDATE exercises SET functions = $1 WHERE exercise_id = $2";
    await pool.query(
      queryText,
      [ functions, exercise_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const updateProposition = async (proposition_id, proposition) => {
  try {
    const queryText =
      "UPDATE propositions SET proposition = $1 WHERE proposition_id = $2";
    await pool.query(
      queryText,
      [ proposition, proposition_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

const updateFormalization = async (formalization_id, formalization) => {
  try {
    const queryText =
      "UPDATE formalizations SET formalization = $1 WHERE formaization_id = $2";
    await pool.query(
      queryText,
      [ formalization, formalization_id ]
    );
  } catch (err) {
    console.error(err.stack);
  }
};

module.exports = {
  updateConstants,
  updatePredicates,
  updateFunctions,
  updateProposition,
  updateFormalization
};
