const pool = require('./db');

const getFeedbacksToProposition = async (proposition_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT f.feedback_id, f.feedback 
             FROM feedbacks f
             JOIN bad_formalizations as b ON b.bad_formalization_id = f.bad_formalization_id 
             WHERE b.proposition_id = $1 and f.active = true`;
        const res = await client.query(queryText, [ proposition_id ]);

        await client.query('COMMIT')
        return res.rows;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const getFeedbacksToBadFormalization = async (bad_formalization_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `SELECT feedback_id, feedback, author, active FROM feedbacks f
             WHERE bad_formalization_id = $1`

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
            `INSERT INTO feedbacks(feedback, bad_formalization_id, author, active)
             VALUES($1, $2, $3, true) RETURNING feedback_id;`

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

module.exports = {
    getFeedbacksToProposition,
    getFeedbacksToBadFormalization,
    saveFeedback,
    updateFeedback
};