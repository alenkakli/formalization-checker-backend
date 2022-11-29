const pool = require('./db');

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

const getAllUsers = async (user, client) => {
    try {
        const queryText = 'SELECT user_name, is_admin FROM users WHERE user_name != $1;'
        const res = await client.query(queryText, [user]);

        return res.rows;

    } catch (err) {
        return null;
    }
};

// progress
const getUsersByExerciseId = async (exercise_id, client) => {
    try {
        const queryText =
            `SELECT DISTINCT ON(u.user_name) u.user_name,
                COUNT(DISTINCT(p.proposition_id)) filter (where s.is_correct = TRUE) as solved,
                COUNT(DISTINCT(p.proposition_id)) filter (where s.is_correct = TRUE OR s.is_correct = FALSE) as attempted,
                COUNT(DISTINCT(p.proposition_id)) as all,
                COUNT(s.is_correct)  filter (where s.is_correct = TRUE) as successful_attempts,
                COUNT(p.exercise_id) as attempts,
                p.exercise_id,
                a.proposition_id as last_attempt_prop,
                a.date as last_attempt_date,
                a.is_correct as last_attempt_correct
            FROM solutions as s INNER JOIN propositions as p ON p.proposition_id = s.proposition_id
                INNER JOIN users as u ON u.github_id = s.user_id
                INNER JOIN
                (SELECT distinct on(proposition_id) proposition_id, date, is_correct 
                    FROM solutions ORDER BY proposition_id, date DESC) as a on a.proposition_id = s.proposition_id
            WHERE p.exercise_id = $1
            GROUP BY u.user_name, p.exercise_id, s.proposition_id, a.is_correct, a.date, a.proposition_id;`

        const res = await client.query(
            queryText,
            [ exercise_id ]
        );
        return res.rows;

    } catch (err) {
        console.log(err)
        return null;
    }
};

const getUserSolutions = async (user_id, exercise_id, client) => {
    try {
        const queryText =
            `SELECT s.solution, s.date, s.is_correct, p.proposition as proposition 
            FROM propositions AS p LEFT JOIN solutions as s ON p.proposition_id = s.proposition_id 
                LEFT JOIN users as u ON s.user_id = u.github_id 
            WHERE p.exercise_id = $1 AND u.user_name = $2 
            ORDER BY p.proposition_id, s.date DESC;`

        const res = await client.query(
            queryText,
            [ exercise_id, user_id ]
        );
        return res.rows;

    } catch (err) {
        return null;
    }
};



const saveUser = async (github_id, user_name, client ) => {
    try {
        const queryText =
            `INSERT INTO users(github_id, user_name, is_admin)
            VALUES($1, $2, FALSE) ON CONFLICT DO NOTHING;`
        await client.query(
            queryText,
            [ github_id, user_name]
        );

    } catch (err) {
        console.error(err.stack);
    }
};

const updateAdmins = async (name, is_admin, client) => {
    try {
        const queryText =
            `UPDATE users SET  is_admin = $2
            WHERE  user_name = $1;`
        await client.query(
            queryText,
            [ name, is_admin]
        );

    } catch (err) {
        console.error(err.stack);
    }
};


module.exports = {
    getUserId,
    getUser,
    getUsersByExerciseId,
    getUserSolutions,
    getAllUsers,
    saveUser,
    updateAdmins
};