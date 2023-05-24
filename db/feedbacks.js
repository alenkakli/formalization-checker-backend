const pool = require('./db');

const getAllFeedbacks= async (bad_formalization_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT f.feedback_id, f.feedback, f.author, f.active, count(fs.id) as shown, 
                count(fs.rating) filter ( where fs.rating > 0) as likes, 
                count(fs.rating) filter ( where fs.rating < 0) as dislikes
             FROM feedbacks f
             LEFT JOIN feedback_to_solution fs on f.feedback_id = fs.feedback_id
             WHERE f.bad_formalization_id = $1
             GROUP BY f.feedback_id, f.feedback, f.author, f.active, f.created
             ORDER BY f.created`

        const res = await client.query(queryText, [ bad_formalization_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getActiveFeedbacks = async (bad_formalization_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT f.feedback_id, f.feedback
             FROM feedbacks f
             WHERE f.bad_formalization_id = $1 and f.active = true
             GROUP BY f.feedback_id, f.feedback
             ORDER BY f.created`

        const res = await client.query(queryText, [ bad_formalization_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const saveFeedback = async (user, bad_formalization_id, feedback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `INSERT INTO feedbacks(feedback, bad_formalization_id, author, active, created)
             VALUES($1, $2, $3, true, now()) RETURNING feedback_id;`

        await client.query(queryText, [ feedback, bad_formalization_id, user]);

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const updateFeedback = async (feedback_id, isActive) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `UPDATE feedbacks SET active = $1 WHERE feedback_id = $2;`

        await client.query(queryText, [ isActive, feedback_id]);

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const saveFeedbackToSolution = async (feedback_id, solution_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `INSERT INTO feedback_to_solution(feedback_id, solution_id, rating, showed)
             VALUES($1, $2, 0, now()) RETURNING id;`

        const res = await client.query(queryText, [ feedback_id, solution_id ]);

        await client.query('COMMIT')
        return res.rows[0].id;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};


const updateFeedbackRating = async (id, rating) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `UPDATE feedback_to_solution SET rating = $2, rated = now() WHERE id = $1;`

        await client.query(queryText, [ id, rating ]);

        await client.query('COMMIT')

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getFeedbackRating = async (solution_id, feedback_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT rating
             FROM feedback_to_solution fs
             WHERE fs.solution_id = $1 and fs.feedback_id = $2`

        const res = await client.query(queryText, [ solution_id, feedback_id ]);

        await client.query('COMMIT')
        return res.rows[0].rating;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};
const getUsersToFeedbackLikes = async (feedback_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT DISTINCT (u.user_name)
             FROM feedback_to_solution fs
             JOIN solutions s on fs.solution_id = s.solution_id
             JOIN users u on s.user_id = u.github_id
             WHERE fs.feedback_id = $1 and fs.rating = 1 and u.is_admin = false`

        const res = await client.query(queryText, [ feedback_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getUsersToFeedbackDislikes = async (feedback_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT DISTINCT (u.user_name)
             FROM feedback_to_solution fs
             JOIN solutions s on fs.solution_id = s.solution_id
             JOIN users u on s.user_id = u.github_id
             WHERE fs.feedback_id = $1 and fs.rating = -1 and u.is_admin = false`

        const res = await client.query(queryText, [ feedback_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getUsersToFeedback = async (feedback_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT DISTINCT (u.user_name)
             FROM feedback_to_solution fs
             JOIN solutions s on fs.solution_id = s.solution_id
             JOIN users u on s.user_id = u.github_id
             WHERE fs.feedback_id = $1 and u.is_admin = false`

        const res = await client.query(queryText, [ feedback_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

module.exports = {
    getAllFeedbacks,
    getActiveFeedbacks,
    saveFeedback,
    updateFeedback,
    saveFeedbackToSolution,
    updateFeedbackRating,
    getFeedbackRating,
    getUsersToFeedbackLikes,
    getUsersToFeedbackDislikes,
    getUsersToFeedback
};