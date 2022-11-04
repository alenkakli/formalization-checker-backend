const express = require('express');
const router = express.Router();
const pool = require("../../db/db");
const { saveUser, updateAdmins } = require('../../db/saveData');
const { getUser, getAllUsers } = require('../../db/getData');
const { ADMIN_NAME, ADMIN_PASSWORD, CLIENT_ID, CLIENT_SECRET } = require('../../config');
const request = require('request');
const {authenticateJWT, generateAccessToken} = require('../../helpers/auth');

// todo najskor zisti ci je admin
router.post('/allUsers', authenticateJWT , async (req, res) => {
    await pool.connect(async (err, client, done) => {
        try {
            const users = req.body;
            if (!users) {
                res.sendStatus(404);
                return;
            }
            client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
                for (let [key, value] of Object.entries(users)) {
                    await updateAdmins(key, value, client);
                }
                client.query('COMMIT;', err => {
                    if (err) {
                        console.error('Error committing transaction', err.stack)
                    }
                    done()
                })
                res.status(200).json(users);
            });
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

router.get('/allUsers/:user_name', authenticateJWT , async (req, res) => {
    await pool.connect(async (err, client, done) => {
        try {
            const user = req.params.user_name;
            client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
                const users = await getAllUsers(user, client);
                client.query('COMMIT;', err => {
                    if (err) {
                        console.error('Error committing transaction', err.stack)
                    }
                    done()
                })
                if (!users) {
                    client.query('ROLLBACK;', err => {
                        if (err) {
                            console.error('Error rolling back client', err.stack)
                        }
                        done()
                    })
                    res.sendStatus(404);
                    return;
                }
                res.status(200).json(users);
            });
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

router.post('/login',  async (req, res) => {
    try {
        let data = req.body;
        if (data.username === ADMIN_NAME && data.password === ADMIN_PASSWORD) {
            const token = generateAccessToken({ username: data.username, isAdmin: true });
            return res.status(200).json({"token": token});
        }
        else {
            console.error("Wrong user name or password")
            res.status(400);
        }

    } catch (err) {
        console.error(err.message);
        res.sendStatus(503);
    }
});

router.post('/login/github/auth' , async (req, res) => {
    await pool.connect(async (err, client, done) => {
        try {
            request.post({
                url: "https://github.com/login/oauth/access_token/?client_id=" + CLIENT_ID +
                    "&client_secret=" + CLIENT_SECRET + "&code=" + req.body.code,
                headers: {
                    'User-Agent': 'request'
                }

            }, function (error, response, body) {
                request.get({
                    url: "https://api.github.com/user",
                    headers: {
                        'User-Agent': 'request',
                        'Authorization': 'token ' + body.split("&")[0].split("=")[1]
                    }
                }, async function (error, response, body) {
                    body = JSON.parse(body);
                    if (body.id !== undefined) {

                        client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
                                await saveUser(body.id, body.login, client);
                                let user = await getUser(body.login, client);
                                await client.query('COMMIT;', err => {
                                    if (err) {
                                        console.error('Error committing transaction', err.stack)
                                    }
                                    done()
                                })

                                const token = generateAccessToken({username: user[0].user_name, isAdmin: user[0].is_admin});
                                res.status(200).json({"token": token});
                            }
                        )}
                });
            });

        } catch (err) {
            client.query('ROLLBACK;', err => {
                if (err) {
                    console.error('Error rolling back client', err.stack)
                }
                done()
            })
            console.error(err.message);
            res.sendStatus(500);
        }
    })
});

module.exports = router;
