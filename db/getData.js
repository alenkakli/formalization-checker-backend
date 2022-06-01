const pool = require('./db');

const getExercisePreviews = async (client) => {
  try {
    const queryText =
        'SELECT e.exercise_id, e.title , count(DISTINCT(s.user_id)) as attempted  FROM (exercises as e INNER JOIN propositions as p ON e.exercise_id = p.exercise_id )  LEFT JOIN solutions as s ON s.proposition_id = p.proposition_id GROUP BY e.exercise_id;' ;
    const res = await client.query(queryText);

    return res.rows;
    
  } catch (err) {
    return null;
  }
};

const getAllUsers = async (user, client) => {
  try {
    const queryText = 'SELECT user_name, is_admin FROM users WHERE user_name != $1;'
    const res = await client.query(queryText, [user]);

    return res.rows;

  } catch (err) {
    return null;
  }
};

const getUserId = async (user_login) => {
  try {
    const queryText =
        'SELECT github_id FROM users WHERE user_name=$1;'

    const res = await pool.query(queryText, [user_login]);
    return res.rows;

  } catch (err) {
    return null;
  }
};

const getUser= async (user_login, client) => {
  try {
    const queryText =
        'SELECT user_name, is_admin FROM users WHERE user_name=$1;'

    const res = await client.query(queryText, [user_login]);
    return res.rows;

  } catch (err) {
    return null;
  }
};

const getExerciseByID = async (exercise_id, user_name, client) => {
  try {
    const queryText =
      'SELECT * FROM exercises WHERE exercise_id = $1;';
    const res = await client.query(
      queryText,
      [ exercise_id ]
    );
    let propositions = await getAllPropositionsForExercise(exercise_id, user_name, client);
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


const getExerciseByIDWithFormalizations = async (exercise_id, client) => {
  try {
    const queryText =
      'SELECT * FROM exercises WHERE exercise_id = $1;';
    const res = await client.query(
      queryText,
      [ exercise_id ]
    );

    let propositions = await getAllPropositionsForExercise(exercise_id, null, client);
    if (res.rows.length !== 1 || !propositions) {
      return null;
    }

    let exercise = res.rows[0];
    for(let i = 0; i < propositions.length; i++){
      propositions[i].formalization = await getAllFormalizationsForProposition(propositions[i].proposition_id, client);
    }

    exercise.propositions = propositions;

    return exercise;

  } catch (err) {
    return null;
  }
};

const getAllPropositionsForExercise = async (exercise_id, user_name, client) => {
  try {
    const queryText =
        'SELECT p.proposition_id, p.proposition, (SELECT s.solution FROM solutions as s LEFT JOIN users as u ON s.user_id = u.github_id   WHERE s.proposition_id = p.proposition_id AND u.user_name = $2 ORDER BY date DESC LIMIT 1) FROM propositions as p WHERE p.exercise_id = $1 ORDER BY p.proposition_id;'
    const res = await client.query(
      queryText,
      [ exercise_id, user_name ]
    );

    if (res.rows.length === 0) {
      return null;
    }

    return res.rows;

  } catch (err) {
    return null;
  }
};

const getAllFormalizationsForProposition = async (proposition_id, client) => {
  try {
    const queryText =
      'SELECT * FROM formalizations WHERE proposition_id = $1;';
    const res = await client.query(
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

const getUsersByExerciseId = async (exercise_id, client) => {
  try {
    const queryText =
        'SELECT DISTINCT(u.user_name),' +
        '        COUNT(DISTINCT(p.proposition_id)) filter (where s.is_correct = TRUE) as solved,' +
        '        COUNT(DISTINCT(p.proposition_id)) filter (where s.is_correct = TRUE OR s.is_correct = FALSE) as attempted,' +
        '         COUNT(DISTINCT(p.proposition_id)) as all,' +
        '          COUNT(s.is_correct)  filter (where s.is_correct = TRUE) as successful_attempts,' +
        '         COUNT(p.exercise_id) as attempts,' +
        '     p.exercise_id,' +
        '                a.proposition_id as last_attempt_prop,' +
        '                a.date as last_attempt_date,' +
        '                a.is_correct as last_attempt_correc' +
        '        FROM solutions as s INNER JOIN propositions as p ON p.proposition_id = s.proposition_id' +
        '        INNER JOIN users as u ON u.github_id = s.user_id' +
        '        INNER JOIN' +
        '            (SELECT date, proposition_id, is_correct FROM' +
        '            solutions ORDER BY date DESC LIMIT 1) as a on a.proposition_id = s.proposition_id' +
        '         WHERE p.exercise_id = $1' +
        '        GROUP BY u.user_name, p.exercise_id, s.proposition_id, a.is_correct, a.date, a.proposition_id;'

    const res = await client.query(
      queryText,
      [ exercise_id ]
    );
    return res.rows;

  } catch (err) {
    return null;
  }
};

const getUserSolutions = async (user_id, exercise_id, client) => {
  try {
    const queryText =
      'SELECT s.solution, s.date, s.is_correct, p.proposition as proposition FROM propositions AS p LEFT JOIN solutions as s ON p.proposition_id = s.proposition_id  LEFT JOIN users as u ON s.user_id = u.github_id WHERE p.exercise_id = $1 AND u.user_name = $2 ORDER BY p.proposition_id, s.date DESC';

    const res = await client.query(
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
  getExerciseByIDWithFormalizations,
  getUser,
  getUsersByExerciseId,
  getUserSolutions,
  getAllUsers
};
