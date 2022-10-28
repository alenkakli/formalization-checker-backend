const express = require('express');
const router = express.Router();
const { TOKEN_SECRET } = require('../../config');
const { getUserId, getUser, getUserSolutions, getAllUsers, getExerciseByIDWithFormalizations } = require('../../db/getData');
const {
    getExercisePreviews, getExerciseByID,
    getAllFormalizationsForProposition,
    getUsersByExerciseId
} = require('../../db/getData');
const jwt = require('jsonwebtoken');
const pool = require("../../db/db");

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

router.get('/progress/:exercise_id', authenticateJWT, async (req, res) => {
    await pool.connect(async (err, client, done) => {
        try {
            if (!isAdmin(req.headers.authorization)) {
                res.sendStatus(403);
                return;
            }
            const {exercise_id} = req.params;
            const parsed_exercise_id = parseInt(exercise_id, 10);
            if (isNaN(parsed_exercise_id)) {
                res.sendStatus(404).end();
                return;
            }

            await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
                const users = await getUsersByExerciseId(parsed_exercise_id, client);
                await client.query('COMMIT;', err => {
                    if (err) {
                        console.error('Error committing transaction', err.stack)
                    }
                    done()
                })

                res.status(200).json(users);
            })

        } catch (err) {
            await client.query('ROLLBACK;', err => {
                if (err) {
                    console.error('Error rolling back client', err.stack)
                }
                done()
            })
            console.error(err.message);
            res.sendStatus(503);
        }
    })
});


router.get('/progress/user/:user_name/:exercise_id', authenticateJWT, async (req, res) => {
    await pool.connect(async (err, client, done) => {
        try {
            if (!isAdmin(req.headers.authorization)) {
                res.sendStatus(403);
                return;
            }
            const {user_name} = req.params;
            const {exercise_id} = req.params;
            const parsed_exercise_id = parseInt(exercise_id, 10);
            if (isNaN(parsed_exercise_id)) {
                res.sendStatus(404).end();
                return;
            }

            client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
                const solutions = await getUserSolutions(user_name, parsed_exercise_id, client);
                client.query('COMMIT;', err => {
                    if (err) {
                        console.error('Error committing transaction', err.stack)
                    }
                    done()
                })

                res.status(200).json(solutions);
            })
        } catch (err) {
            client.query('ROLLBACK;', err => {
                if (err) {
                    console.error('Error rolling back client', err.stack)
                }
                done()
            })
            console.error(err.message);
            res.sendStatus(503);
        }
    })
});