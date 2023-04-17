const pool = require('./db');

const getUser= async (user_login) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            'SELECT user_name, is_admin FROM users WHERE user_name=$1;'
        const res = await client.query(queryText, [user_login]);

        await client.query('COMMIT')
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const _getUserId = async (user_login, client) => {
    const queryText =
        'SELECT github_id FROM users WHERE user_name=$1;'
    const res = await client.query(queryText, [user_login]);

    return res.rows;
};

const getAllUsers = async (user) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            'SELECT user_name, is_admin FROM users WHERE user_name != $1;'
        const res = await client.query(queryText, [user]);

        await client.query('COMMIT')
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const saveUser = async (github_id, user_name ) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `INSERT INTO users(github_id, user_name, is_admin) 
             VALUES($1, $2, FALSE) ON CONFLICT DO NOTHING;`
        const res = await client.query(queryText, [ github_id, user_name ]);

        await client.query('COMMIT')
        return res.rows;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }

};

const updateAdmins = async (name, is_admin) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED')
        const queryText =
            `UPDATE users SET is_admin = $2 WHERE user_name = $1;`
        const res = await client.query(queryText, [ name, is_admin ]);

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
    getUser,
    _getUserId,
    getAllUsers,
    saveUser,
    updateAdmins
};