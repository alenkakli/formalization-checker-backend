const pool = require('./db');

const getExercisePreviews = async () => {
  try {
    const queryText = 'SELECT exercise_id, title FROM exercises';
    const res = await pool.query(queryText);

    return res.rows;
    
  } catch (err) {
    return null;
  }
};

const getExerciseByID = async (exercise_id) => {
  try {
    const queryText =
      'SELECT * FROM exercises WHERE exercise_id = $1';
    const res = await pool.query(
      queryText,
      [ exercise_id ]
    );

    let propositions = await getAllPropositionsForExercise(exercise_id);
    if (res.rows.length !== 1 || !propositions) {
      return null;
    }

    let exercise = res.rows[0];
    exercise.propositions = propositions;
    return exercise;

  } catch (err) {
    return null;
  }
};

const getAllPropositionsForExercise = async (exercise_id) => {
  try {
    const queryText =
      'SELECT proposition_id, proposition FROM propositions WHERE exercise_id = $1';
    const res = await pool.query(
      queryText,
      [ exercise_id ]
    );
    
    if (res.rows.length === 0) {
      return null;
    }

    return res.rows;

  } catch (err) {
    return null;
  }
};

const getAllFormalizationsForProposition = async (proposition_id) => {
  try {
    const queryText =
      'SELECT * FROM formalizations WHERE proposition_id = $1';
    const res = await pool.query(
      queryText,
      [ proposition_id ]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return res.rows;

  } catch (err) {
    return null;
  }
};


module.exports = {
  getExercisePreviews,
  getExerciseByID,
  getAllFormalizationsForProposition
};
