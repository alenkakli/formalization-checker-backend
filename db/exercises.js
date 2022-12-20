const pool = require('./db');
const {_getUserId} = require("./users");
const evaluate = require('../helpers/evaluate');

function UserException(message) {
    this.message = message;
    this.name = 'UserException';
}
function ExerciseException() {
    this.name = 'ExerciseException';
}

const getExerciseByID = async (exercise_id, user_name) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE')

        let exercise = _getExerciseByID(exercise_id, user_name, client)

        await client.query('COMMIT')
        return exercise;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const _getExerciseByID = async (exercise_id, user_name, client) => {
    try {
        const queryText =
            'SELECT * FROM exercises WHERE exercise_id = $1;'
        const res = await client.query(queryText, [exercise_id]);

        let propositions = await _getAllPropositionsForExercise(exercise_id, user_name, client);
        if (res.rows.length !== 1 || !propositions) {
            return null;
        }
        let exercise = res.rows[0];
        exercise.propositions = propositions;

        return exercise;
    } catch (e) {
        throw e
    }

};

const getExerciseByIDWithFormalizations = async (exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE')
        const queryText =
            'SELECT * FROM exercises WHERE exercise_id = $1;'
        const res = await client.query(queryText, [exercise_id]);

        let propositions = await _getAllPropositionsForExercise(exercise_id, null, client);
        if (res.rows.length !== 1 || !propositions) {
            return null;
        }

        let exercise = res.rows[0];
        for(let i = 0; i < propositions.length; i++){
            propositions[i].formalization = await _getAllFormalizationsForProposition(propositions[i].proposition_id, client);
        }
        exercise.propositions = propositions;

        await client.query('COMMIT')
        return exercise;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const getExercisePreviews = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT e.exercise_id, e.title , count(DISTINCT(s.user_id)) as attempted  
            FROM (exercises as e INNER JOIN propositions as p ON e.exercise_id = p.exercise_id )  
                LEFT JOIN solutions as s ON s.proposition_id = p.proposition_id GROUP BY e.exercise_id;`;
        const res = await client.query(queryText);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const _getAllPropositionsForExercise = async (exercise_id, user_name, client) => {
    try {
        const queryText =
            `SELECT p.proposition_id, p.proposition,
                    (SELECT s.solution FROM solutions as s
                                                LEFT JOIN users as u ON s.user_id = u.github_id
                     WHERE s.proposition_id = p.proposition_id AND u.user_name = $2
                     ORDER BY date DESC LIMIT 1)
             FROM propositions as p WHERE p.exercise_id = $1 ORDER BY p.proposition_id;`
        const res = await client.query( queryText, [ exercise_id, user_name ] );

        if (res.rows.length === 0) {
            return null;
        }

        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }

};

const _getAllFormalizationsForProposition = async (proposition_id, client) => {
    try {
        await client.query('BEGIN')

        const queryText =
            'SELECT * FROM formalizations WHERE proposition_id = $1;'
        const res = await client.query( queryText, [ proposition_id ]);
        if (res.rows.length === 0) {
            return null;
        }

        await client.query('COMMIT')

        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }

};

const saveExercise = async (
    { title, description, constants, predicates, functions, propositions, constraint }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')

        const queryText =
            `INSERT INTO exercises(title, description, constants, predicates, functions, constraints)
            VALUES($1, $2, $3, $4, $5, $6) RETURNING exercise_id;`
        const res = await client.query(
            queryText,
            [ title, description, constants, predicates, functions, constraint ]
        );

        const exerciseID = res.rows[0].exercise_id;

        propositions.forEach(p => {
            _saveProposition(exerciseID, p, client);
        });

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _saveProposition = async (exerciseID, { proposition, formalizations, constraints }, client) => {
    try {
        const queryText =
            `INSERT INTO propositions(proposition, exercise_id)
            VALUES($1, $2) RETURNING proposition_id;`
        const res = await client.query(
            queryText,
            [ proposition, exerciseID ]
        );

        const propositionID = res.rows[0].proposition_id;

        for(let i = 0; i < formalizations.length; i++){
            _saveFormalization(propositionID, formalizations[i], constraints[i], client);
        }

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }
};

const _saveFormalization = async (propositionID, formalization, constraint, client) => {
    try {
        const queryText =
            `INSERT INTO formalizations(formalization, constraints, proposition_id)
            VALUES($1, $2, $3);`
        await client.query(
            queryText,
            [ formalization, constraint, propositionID ]
        );

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }
};

const _saveSolution = async (studentID, propositionID, studentSolution, correctSolution, client) => {
    try {
        await client.query('BEGIN')

        const queryText =
            `INSERT INTO solutions(user_id, proposition_id, solution, is_correct, date) 
            VALUES($1, $2, $3, $4, NOW()::timestamp) returning solution_id;`
        await client.query(
            queryText,
            [ studentID, propositionID, studentSolution, correctSolution ]
        );

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }
};

const updateExercise = async (exercise) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ')

        const queryText =
            `UPDATE exercises SET title = $2, description = $3, constants = $4, predicates = $5, functions = $6, constraints = $7
             WHERE  exercise_id = $1;`
        await client.query(
            queryText,
            [ exercise.id, exercise.title, exercise.description, exercise.constants, exercise.predicates, exercise.functions, exercise.constraint,]
        );

        await _removeProposition(exercise.id, client);
        for(let i = 0; i < exercise.propositions.length; i++){
            await _saveProposition(exercise.id,
                {"proposition": exercise.propositions[i].proposition,
                    "formalizations": exercise.propositions[i].formalizations, "constraints": exercise.propositions[i].constraints}, client)
        }

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const removeExercise = async (exercise) => {
    const client = await pool.connect();
    try {
        const queryText =
            'DELETE FROM exercises WHERE exercise_id = $1;'
        await client.query(
            queryText,
            [ exercise.id]
        );
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _removeProposition = async (exercise_id, client) => {
    try {
        const queryText =
            'DELETE FROM propositions WHERE exercise_id = $1;'
        await client.query(
            queryText,
            [ exercise_id]
        );
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    }
};
const evaluateResult = async (user, exercise_id, proposition_id, solution) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

        let user_id = await _getUserId(user, client);
        user_id = user_id[0].github_id;

        if (isNaN(parseInt(user_id))) {
            throw new UserException("Missing log in user");
        }

        const formalizations = await _getAllFormalizationsForProposition(proposition_id, client);
        let exercise = await _getExerciseByID(exercise_id, null, client);

        if (!formalizations || !exercise || formalizations.length === 0) {
            throw new ExerciseException();
        }

        const eval_status = await evaluate(solution, formalizations, exercise); //, res, saveSolutionWithResult);

        const isCorrectSolution = (eval_status.solutionToFormalization === 'OK' &&
            eval_status.formalizationToSolution === 'OK')
        await _saveSolution(user_id, proposition_id, solution, isCorrectSolution, client);

        await client.query('COMMIT');

        return eval_status;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};


module.exports = {
    getExercisePreviews,
    getExerciseByID,
    getExerciseByIDWithFormalizations,
    saveExercise,
    updateExercise,
    removeExercise,
    evaluateResult,
    UserException,
    ExerciseException
};