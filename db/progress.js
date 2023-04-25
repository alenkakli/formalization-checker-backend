const pool = require('./db');

const getUsersByExerciseId = async (exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT user_name, solved, attempted, successful_attempts, attempts, last_attempt_date, 
                    exercise_id, a.is_correct as last_attempt_correct, a.solution_id as last_attempt
            FROM (
                SELECT 
                    DISTINCT u.user_name as user_name,
                    COUNT(DISTINCT (p.proposition_id)) filter (where s.is_correct = TRUE) as solved, 
                    COUNT(DISTINCT (p.proposition_id)) as attempted,
                    COUNT(s.is_correct) filter (where s.is_correct = TRUE) as successful_attempts, 
                    COUNT(s.solution_id) as attempts,
                    MAX(s.date) as last_attempt_date,
                    p.exercise_id as exercise_id
                  FROM solutions as s
                    INNER JOIN users as u ON s.user_id = u.github_id
                    INNER JOIN propositions as p ON s.proposition_id = p.proposition_id
                WHERE p.exercise_id = $1
                GROUP BY u.user_name, p.exercise_id) as t1

            INNER JOIN solutions as a ON last_attempt_date = a.date
            ORDER BY last_attempt_date DESC`;

        const res = await client.query( queryText, [ exercise_id ] );

        await client.query('COMMIT');
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const getExercisesByUserName = async (user_name) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT user_name, exercise_id, title, solved, attempted, successful_attempts, attempts,
                    last_attempt_date, a.is_correct as last_attempt_correct, a.solution_id as last_attempt
             FROM (SELECT
                        u.user_name as user_name,
                        COUNT(DISTINCT (p.proposition_id)) filter (where s.is_correct = TRUE) as solved,
                        COUNT(DISTINCT (p.proposition_id)) as attempted,
                        COUNT(s.is_correct) filter (where s.is_correct = TRUE) as successful_attempts,
                        COUNT(s.solution_id) as attempts,
                        MAX(s.date) as last_attempt_date,
                        p.exercise_id as exercise_id,
                        e.title as title

                   FROM solutions as s
                        INNER JOIN users as u ON s.user_id = u.github_id
                        INNER JOIN propositions as p ON s.proposition_id = p.proposition_id
                        INNER JOIN exercises as e ON e.exercise_id = p.exercise_id
                   WHERE u.user_name = $1
                   GROUP BY u.user_name, p.exercise_id, e.title) as t1

                      INNER JOIN solutions as a ON last_attempt_date = a.date
             ORDER BY last_attempt_date DESC`;

        const res = await client.query( queryText, [ user_name ] );

        await client.query('COMMIT');
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};
const getUserSolutions = async (user_id, exercise_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')

        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const solutions = await _getUserSolutions(user_id, exercise_id, client);
        for (let i = 0; i < solutions.length; i++) {
            const solution = solutions[i]
            solution.feedbacks = await _getFeedbacksToSolution(solution.solution_id, client)
        }

        await client.query('COMMIT')
        return solutions;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const _getUserSolutions = async (user_id, exercise_id, client) => {
    const queryText =
        `SELECT e.exercise_id, e.title, s.solution_id, s.solution, s.date, s.is_correct, p.proposition_id, p.proposition  
         FROM propositions as p
                  LEFT JOIN solutions as s ON p.proposition_id = s.proposition_id
                  LEFT JOIN users as u ON s.user_id = u.github_id
                  LEFT JOIN exercises as e ON p.exercise_id = e.exercise_id
         WHERE p.exercise_id = $1 AND u.user_name = $2
         ORDER BY p.proposition_id, s.date DESC;`

    const res = await client.query( queryText, [ exercise_id, user_id ] );
    return res.rows;
};


const _getFeedbacksToSolution = async (solution_id, client) => {
    const queryText =
        `SELECT fs.feedback_id, f.feedback  FROM feedback_to_solution as fs
            JOIN feedbacks as f ON fs.feedback_id = f.feedback_id
         WHERE fs.solution_id = $1`

    const res = await client.query( queryText, [ solution_id ] );

    return (res === null) ? null : res.rows;
};
module.exports = {
    getUsersByExerciseId,
    getExercisesByUserName,
    getUserSolutions
};