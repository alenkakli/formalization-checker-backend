const pool = require('./db');

const saveExercise = async (
  { title, description, constants, predicates, functions, propositions }
) => {
  try {
    const queryText =
      'INSERT INTO exercises(title, description, constants, predicates, functions) '
      + 'VALUES($1, $2, $3, $4, $5) RETURNING exercise_id';
    const res = await pool.query(
      queryText,
      [ title, description, constants, predicates, functions ]
    );

    const exerciseID = res.rows[0].exercise_id;

    propositions.forEach(p => {
      saveProposition(exerciseID, p);
    });
    
  } catch (err) {
    console.error(err.stack);
  }
};

const saveProposition = async (exerciseID, { proposition, formalizations }) => {
  try {
    const queryText =
      'INSERT INTO propositions(proposition, exercise_id) '
      + 'VALUES($1, $2) RETURNING proposition_id';
    const res = await pool.query(
      queryText,
      [ proposition, exerciseID ]
    );

    const propositionID = res.rows[0].proposition_id;

    formalizations.forEach(f => {
      saveFormalization(propositionID, f);
    });

  } catch (err) {
    console.error(err.stack);
  }
};

const saveFormalization = async (propositionID, formalization) => {
  try {
    const queryText =
      'INSERT INTO formalizations(formalization, proposition_id) '
      + 'VALUES($1, $2)';
    await pool.query(
      queryText,
      [ formalization, propositionID ]
    );

  } catch (err) {
    console.error(err.stack);
  }
};

const saveSolution = async (studentID, propositionID, studentSolution, correctSolution) => {
  try {
    const queryText =
        'INSERT INTO solutions(user_id, proposition_id, solution, is_correct) '
        + 'VALUES($1, $2, $3, $4) returning solution_id';
    await pool.query(
        queryText,
        [ studentID, propositionID, studentSolution, correctSolution ]
    );

  } catch (err) {
    console.error(err.stack);
  }
};

const saveUser = async (github_id, user_name ) => {
  try {
    const queryText =
        'INSERT INTO users(github_id, user_name)'
        + 'VALUES($1, $2) ON CONFLICT DO NOTHING;';
    await pool.query(
        queryText,
        [ github_id, user_name]
    );

  } catch (err) {
    console.error(err.stack);
  }
};


module.exports = {
  saveExercise,
  saveSolution,
  saveUser
};
