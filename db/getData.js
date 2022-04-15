const pool = require('./db');

const getExercisePreviews = async () => {
  try {
    const queryText = 'SELECT e.exercise_id, e.title, count(DISTINCT(s.user_id)) as attempted FROM (exercises as e INNER JOIN propositions as p ON e.exercise_id = p.exercise_id ) INNER JOIN solutions as s ON s.proposition_id = p.proposition_id GROUP BY e.exercise_id, e.title;'
    const res = await pool.query(queryText);

    return res.rows;
    
  } catch (err) {
    return null;
  }
};
const getUserId = async (user_login) => {
  try {
    const queryText = 'SELECT github_id FROM users WHERE user_name=$1;';
    const res = await pool.query(queryText, [user_login]);
    return res.rows;

  } catch (err) {
    return null;
  }
};

const getUser= async (user_login) => {
  try {
    const queryText = 'SELECT user_name, is_admin FROM users WHERE user_name=$1;';
    const res = await pool.query(queryText, [user_login]);
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

const getUsersByExerciseId = async (exercise_id) => {
  try {
    const queryText =
        'SELECT DISTINCT(u.user_name), (SELECT COUNT(proposition_id) FROM solutions WHERE is_correct = true  ) as solved, COUNT(p.exercise_id) as attempts, p.exercise_id FROM solutions as s INNER JOIN propositions as p ON p.proposition_id = s.proposition_id INNER JOIN users as u ON u.github_id = s.user_id WHERE p.exercise_id = $1 GROUP BY u.user_name, p.exercise_id;'
    ;
    const res = await pool.query(
      queryText,
      [ exercise_id ]
    );
    return res.rows;

  } catch (err) {
    return null;
  }
};

const getUserSolutions = async (user_id, exercise_id) => {
  try {
    const queryText =
      'SELECT s.solution, s.date, s.is_correct, p.proposition FROM solutions AS s INNER JOIN propositions as p ON p.proposition_id = s.proposition_id  INNER JOIN users as u ON s.user_id = u.github_id WHERE p.exercise_id = $1 AND u.user_name = $2 ORDER BY p.proposition, s.date DESC';

    const res = await pool.query(
      queryText,
      [ exercise_id, user_id ]
    );
    return res.rows;

  } catch (err) {
    return null;
  }
};


module.exports = {
  getExercisePreviews,
  getExerciseByID,
  getAllFormalizationsForProposition,
  getUserId,
  getUser,
  getUsersByExerciseId,
  getUserSolutions
};
