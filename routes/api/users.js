const express = require('express');
const router = express.Router();
const { getUser, getAllUsers, saveUser, updateAdmins } = require('../../db/users');
const { ADMIN_NAME, ADMIN_PASSWORD, CLIENT_ID, CLIENT_SECRET } = require('../../config');
const request = require('request');
const { generateAccessToken, authAdmin } = require('../../helpers/auth');

router.post('/', authAdmin, async (req, res) => {
    try {
        const users = req.body;
        if (!users) {
            res.sendStatus(404);
            return;
        }

        for (let [key, value] of Object.entries(users)) {
            await updateAdmins(key, value);
        }

        res.status(200).json(users);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/:user_name', async (req, res) => {
    try {
        const user = req.params.user_name;
        const users = await getAllUsers(user);

        if (!users) {
            res.sendStatus(404);
            return;
        }

        res.status(200).json(users);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

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
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }
});

router.post('/login/github/auth', async (req, res) => {
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

                        await saveUser(body.id, body.login);
                        let user = await getUser(body.login);
                        const token = generateAccessToken({username: user[0].user_name, isAdmin: user[0].is_admin});
                        res.status(200).json({"token": token});
                    }
                })
            });

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

module.exports = router;
