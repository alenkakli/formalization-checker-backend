const pool = require('./db');
const {_getUserId} = require("./users");
const evaluate = require('../helpers/evaluate');
const evaluateBadFormalization = require('../helpers/badFormalization');
const {LanguageToVampire} = require("../helpers/language");

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
    const queryText =
        'SELECT * FROM exercises WHERE exercise_id = $1;'
    const res = await client.query(queryText, [exercise_id]);

    let propositions = await _getAllPropositionsToExercise(exercise_id, user_name, client);
    if (res.rows.length !== 1 || !propositions) {
        return null;
    }

    let exercise = res.rows[0];
    exercise.propositions = propositions;

    return exercise;
};

const getExerciseByIDWithFormalizations = async (exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE')
        const queryText =
            'SELECT * FROM exercises WHERE exercise_id = $1;'
        const res = await client.query(queryText, [exercise_id]);

        let propositions = await _getAllPropositionsToExercise(exercise_id, null, client);
        if (res.rows.length !== 1 || !propositions) {
            return null;
        }

        let exercise = res.rows[0];
        for (let i = 0; i < propositions.length; i++) {
            propositions[i].formalization = await _getAllFormalizationsToProposition(propositions[i].proposition_id, client);
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
            `SELECT e.exercise_id, e.title, count(DISTINCT (s.user_id)) as attempted
             FROM (exercises as e INNER JOIN propositions as p ON e.exercise_id = p.exercise_id)
                      LEFT JOIN solutions as s ON s.proposition_id = p.proposition_id
             GROUP BY e.exercise_id`;
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

const getExerciseTitle = async (exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT title
             FROM exercises
             WHERE exercise_id = $1`;
        const res = await client.query(queryText, [exercise_id]);

        await client.query('COMMIT')
        return res.rows[0].title;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getPropositionTitle = async (proposition_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT proposition
             FROM propositions
             WHERE proposition_id = $1`;
        const res = await client.query(queryText, [proposition_id]);

        await client.query('COMMIT')
        return res.rows[0].proposition;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getAllPropositionsToExercise = async (exercise_id, user_name, client) => {
    const queryText =
        `SELECT p.proposition_id,
                p.proposition,
                (SELECT s.solution
                 FROM solutions as s
                          LEFT JOIN users as u ON s.user_id = u.github_id
                 WHERE s.proposition_id = p.proposition_id
                   AND u.user_name = $2
                 ORDER BY date DESC
                 LIMIT 1)
         FROM propositions as p
         WHERE p.exercise_id = $1
         ORDER BY p.proposition_id;`
    const res = await client.query(queryText, [exercise_id, user_name]);

    if (res.rows.length === 0) {
        return null;
    }

    return res.rows;
};

const getAllFormalizationsToProposition = async (proposition_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')

        const res = await _getAllFormalizationsToProposition(proposition_id, client);

        await client.query('COMMIT')
        return res;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getAllFormalizationsToProposition = async (proposition_id, client) => {
    const queryText =
        `SELECT *
         FROM formalizations
         WHERE proposition_id = $1;`
    const res = await client.query(queryText, [proposition_id]);

    if (res.rows.length === 0) {
        return null;
    }

    return res.rows;
};

const _getAllBadFormalizationsToProposition = async (proposition_id, client) => {
    const queryText =
        `SELECT *
         FROM bad_formalizations
         WHERE proposition_id = $1;`
    const res = await client.query(queryText, [proposition_id]);

    if (res.rows.length === 0) {
        return null;
    }

    return res.rows;
};

const getBadExercises = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT DISTINCT e.exercise_id,
                             e.title,
                             count(DISTINCT (s.bad_formalization_id)) as bad_formalizations,
                             count(DISTINCT (s.user_id)) as students
             FROM exercises e
                      INNER JOIN propositions p ON e.exercise_id = p.exercise_id
                      LEFT JOIN bad_formalizations b ON b.proposition_id = p.proposition_id
                      LEFT JOIN solutions s ON b.bad_formalization_id = s.bad_formalization_id
             GROUP BY e.exercise_id, e.title`;
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

const getBadPropositionsToExercise = async (exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const propositions = await _getBadPropositionsToExercise(exercise_id, client);

        for (let i = 0; i < propositions.length; i++) {
            propositions[i].bad_formalizations = await _getNumberOfBadFormalizationsToProposition(propositions[i].proposition_id, client);
            propositions[i].students = await _getNumberOfStudentsToProposition(propositions[i].proposition_id, client);
        }
        propositions.sort((a, b) => {
            return b.students - a.students;
        })

        await client.query('COMMIT')
        return propositions;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getBadPropositionsToExercise = async (exercise_id, client) => {
    const queryText =
        `SELECT DISTINCT ON (p.proposition_id) p.proposition_id, p.proposition
         FROM bad_formalizations b
                  JOIN propositions p ON b.proposition_id = p.proposition_id
         WHERE p.exercise_id = $1`

    const res = await client.query(queryText, [exercise_id]);
    return res.rows;
};

const _getNumberOfBadFormalizationsToProposition = async (proposition_id, client) => {
    const queryText =
        `SELECT count(*)
         FROM bad_formalizations b
                  JOIN propositions p ON b.proposition_id = p.proposition_id
         WHERE b.proposition_id = $1`

    const res = await client.query(queryText, [proposition_id]);
    return res.rows[0].count;
};

const _getNumberOfStudentsToProposition = async (proposition_id, client) => {
    const queryText =
        `SELECT count(DISTINCT (user_id))
         FROM solutions
         WHERE proposition_id = $1
           and is_correct = false`

    const res = await client.query(queryText, [proposition_id]);
    return res.rows[0].count;
};

const getBadFormalizationsToProposition = async (exercise_id, proposition_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const formalizations = await _getBadFormalizationsToProposition(proposition_id, client);

        for (let i = 0; i < formalizations.length; i++) {
            formalizations[i].students = await _getStudentsToBadFormalization(formalizations[i].bad_formalization_id, client);
        }
        formalizations.sort((a, b) => {
            return b.students.length - a.students.length;
        })

        await client.query('COMMIT')
        return formalizations;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getBadFormalizationsToProposition = async (proposition_id, client) => {
    const queryText =
        `SELECT b.bad_formalization_id
         FROM bad_formalizations b
         WHERE b.proposition_id = $1`

    const res = await client.query(queryText, [proposition_id]);
    return res.rows;
};

const getBadFormalizationInfo = async (exercise_id, bad_formalization_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const bad_formalization = await _getBadFormalization(bad_formalization_id, client);
        bad_formalization.bad_solutions = await _getAllSolutionsToBadFormalization(bad_formalization_id, exercise_id, client);

        await client.query('COMMIT')
        return bad_formalization;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getBadFormalization = async (bad_formalization_id, client) => {
    const queryText =
        `SELECT bad_formalization_id, bad_formalization
         FROM bad_formalizations b
         WHERE bad_formalization_id = $1`

    const res = await client.query(queryText, [bad_formalization_id]);
    return res.rows[0];
};

const _getAllSolutionsToBadFormalization = async (bad_formalization_id, exercise_id, client) => {
    const queryText =
        `SELECT DISTINCT ON (solution) solution, solution_id, user_id
         FROM solutions
         WHERE bad_formalization_id = $1`

    const res = await client.query(queryText, [bad_formalization_id]);
    if (res.rows.length === 1) {
        return null;
    }

    let uniqueRes = [];
    uniqueRes.push(res.rows[0]);
    let exercise = await _getExerciseByID(exercise_id, null, client);
    let l1, l2, formulaToVampire1, formulaToVampire2 = null;

    for (let i = 1; i < res.rows.length; i++) {
        l1 = new LanguageToVampire();
        formulaToVampire1 = l1.formulaToVampire(exercise);
        let a = res.rows[i].solution;
        a = formulaToVampire1(a);

        let isUnique = true;

        for (let j = 0; j < uniqueRes.length; j++) {
            l2 = new LanguageToVampire();
            formulaToVampire2 = l2.formulaToVampire(exercise);
            let b = uniqueRes[j].solution;
            b = formulaToVampire2(b);
            if (a === b) {
                isUnique = false;
                break;
            }
        }

        if (isUnique) {
            uniqueRes.push(res.rows[i]);
        }
    }

    if (uniqueRes.length === 1) {
        return null;
    }

    return uniqueRes;
};

const _getStudentsToBadFormalization = async (bad_formalization_id, client) => {
    const queryText =
        `SELECT DISTINCT ON (user_name) user_name, solution_id
         FROM solutions
         JOIN users u on solutions.user_id = u.github_id
         WHERE bad_formalization_id = $1
         ORDER BY user_name, date DESC`

    const res = await client.query(queryText, [bad_formalization_id]);
    return res.rows;
};

const saveExercise = async (
    {title, description, constants, predicates, functions, propositions, constraint}) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `INSERT INTO exercises(title, description, constants, predicates, functions, constraints)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING exercise_id;`

        const res = await client.query(queryText, [title, description, constants, predicates, functions, constraint]);
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

const _saveProposition = async (exerciseID, {proposition, formalizations, constraints}, client) => {
    const queryText =
        `INSERT INTO propositions(proposition, exercise_id)
         VALUES ($1, $2)
         RETURNING proposition_id;`

    const res = await client.query(queryText, [proposition, exerciseID]);
    const propositionID = res.rows[0].proposition_id;
    for (let i = 0; i < formalizations.length; i++) {
        await _saveFormalization(propositionID, formalizations[i], constraints[i], client);
    }
};

const _saveFormalization = async (propositionID, formalization, constraint, client) => {
    const queryText =
        `INSERT INTO formalizations(formalization, constraints, proposition_id)
         VALUES ($1, $2, $3);`

    await client.query(queryText, [formalization, constraint, propositionID]);
};

const _saveSolution = async (studentID, propositionID, formalizationID, badFormalizationID, studentSolution, correctSolution, client) => {
    const queryText =
        `INSERT INTO solutions(user_id, proposition_id, formalization_id, bad_formalization_id, solution, is_correct,
                               date)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()::timestamp) RETURNING solution_id`

    const res = await client.query(
        queryText,
        [studentID, propositionID, formalizationID, badFormalizationID, studentSolution, correctSolution]
    );
    return res.rows[0].solution_id;
};

const _saveBadFormalization = async (studentSolution, propositionID, client) => {
    const queryText =
        `INSERT INTO bad_formalizations(bad_formalization, proposition_id)
         VALUES ($1, $2)
         RETURNING bad_formalization_id;`

    const res = await client.query(queryText, [studentSolution, propositionID]);
    return res.rows[0].bad_formalization_id;
};

const updateExercise = async (exercise) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ')
        const queryText =
            `UPDATE exercises
             SET title = $2,
                 description = $3,
                 constants = $4,
                 predicates = $5,
                 functions = $6,
                 constraints = $7
             WHERE exercise_id = $1;`

        await client.query(
            queryText,
            [exercise.id, exercise.title, exercise.description, exercise.constants,
                exercise.predicates, exercise.functions, exercise.constraint]
        );

        await _removeProposition(exercise.id, client);
        for (let i = 0; i < exercise.propositions.length; i++) {
            await _saveProposition(exercise.id, {
                "proposition": exercise.propositions[i].proposition,
                "formalizations": exercise.propositions[i].formalizations,
                "constraints": exercise.propositions[i].constraints
            }, client)
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
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ')
        const queryText =
            'DELETE FROM exercises WHERE exercise_id = $1;'

        await client.query(queryText, [exercise.id]);
        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _removeProposition = async (exercise_id, client) => {
    const queryText =
        'DELETE FROM propositions WHERE exercise_id = $1;'

    await client.query(queryText, [exercise_id]);
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

        const migration = false;
        const {
            eval_status,
            isCorrectSolution,
            bad_formalization_id,
            formalization_id
        } = await findEquivalentSolutions(proposition_id, exercise_id, solution, client, migration);
        const solution_id = await _saveSolution(user_id, proposition_id, formalization_id, bad_formalization_id, solution, isCorrectSolution, client);
        eval_status.bad_formalization_id = bad_formalization_id;
        eval_status.solution_id = solution_id;

        await client.query('COMMIT');
        return eval_status;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const findEquivalentSolutions = async (proposition_id, exercise_id, solution, client, migration) => {
    const formalizations = await _getAllFormalizationsToProposition(proposition_id, client);
    let exercise = await _getExerciseByID(exercise_id, null, client);

    if (!formalizations || !exercise || formalizations.length === 0) {
        throw new ExerciseException();
    }

    const eval_status = await evaluate(solution, formalizations, exercise, migration);
    const isCorrectSolution = (eval_status.solutionToFormalization === 'OK' &&
        eval_status.formalizationToSolution === 'OK')

    let bad_formalization_id = null;
    if (!isCorrectSolution) {
        const bad_formalizations = await _getAllBadFormalizationsToProposition(proposition_id, client);
        if (bad_formalizations !== null) {
            bad_formalization_id = await evaluateBadFormalization(solution, bad_formalizations, exercise);
            if (bad_formalization_id === null) {
                bad_formalization_id = await _saveBadFormalization(solution, proposition_id, client);
            }
        } else {
            bad_formalization_id = await _saveBadFormalization(solution, proposition_id, client);
        }
    }


    const formalization_id = formalizations[0].formalization_id;

    return {eval_status, isCorrectSolution, bad_formalization_id, formalization_id};
}

module.exports = {
    getExercisePreviews,
    getExerciseByID,
    getExerciseByIDWithFormalizations,
    getExerciseTitle,
    getPropositionTitle,
    getAllFormalizationsToProposition,
    getBadExercises,
    getBadPropositionsToExercise,
    getBadFormalizationsToProposition,
    getBadFormalizationInfo,
    saveExercise,
    updateExercise,
    removeExercise,
    evaluateResult,
    findEquivalentSolutions,
    UserException,
    ExerciseException,
};