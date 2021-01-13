const pool = require('./db');

const getAllExercises = async () => {
  try {
    const queryText = "SELECT * FROM exercises";
    const res = await pool.query(queryText);

    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const getExerciseByID = async (exercise_id) => {
  try {
    const queryText =
      "SELECT * FROM exercises WHERE exercise_id = $1";
    const res = await pool.query(
      queryText,
      [ exercise_id ]
    );

    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const getAllPropositionsForExercise = async (exercise_id) => {
  try {
    const queryText =
      "SELECT * FROM propositions WHERE exercise_id = $1";
    const res = await pool.query(
      queryText,
      [ exercise_id ]
    );
    
    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const getPropositionByID = async (proposition_id) => {
  try {
    const queryText =
      "SELECT * FROM propositions WHERE proposition_id = $1";
    const res = await pool.query(
      queryText,
      [ proposition_id ]
    );

    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const getAllFormalizationsForProposition = async (proposition_id) => {
  try {
    const queryText =
      "SELECT * FROM formalizations WHERE proposition_id = $1";
    const res = await pool.query(
      queryText,
      [ proposition_id ]
    );

    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const getFormalizationByID = async (formalization_id) => {
  try {
    const queryText =
      "SELECT * FROM formalizations WHERE formalization_id = $1";
    const res = await pool.query(
      queryText,
      [ formalization_id ]
    );

    return res.rows;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

module.exports = {
  getAllExercises,
  getExerciseByID,
  getAllPropositionsForExercise,
  getPropositionByID,
  getAllFormalizationsForProposition,
  getFormalizationByID
};
