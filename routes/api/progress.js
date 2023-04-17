const express = require('express');
const router = express.Router();
const { getUsersByExerciseId, getUserSolutions } = require('../../db/progress');
const { isAdmin, authAdmin } = require('../../helpers/auth');
const {getExercisesByUserName} = require("../../db/progress");


router.get('/', async (req, res) => {
    try {
        const user_name = req.auth.username;
        const previews = await getExercisesByUserName(user_name);
        if (previews === null) {
            res.sendStatus(500);
            return;
        }

        res.status(200).json(previews);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});
router.get('/:exercise_id', async (req, res) => {
    try {
        const {exercise_id} = req.params;
        const parsed_exercise_id = parseInt(exercise_id, 10);

        if (isNaN(parsed_exercise_id)) {
            res.sendStatus(400).end();
            return;
        }

        const users = await getUsersByExerciseId(parsed_exercise_id);
        res.status(200).json(users);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/:exercise_id/:user_name', async (req, res) => {
    try {
        const {user_name, exercise_id} = req.params;
        if (!isAdmin(req) && req.auth.username !== user_name) {
            res.sendStatus(401).end();
            return;
        }

        const parsed_exercise_id = parseInt(exercise_id, 10);
        if (isNaN(parsed_exercise_id)) {
            res.sendStatus(400).end();
            return;
        }

        const solutions = await getUserSolutions(user_name, parsed_exercise_id);
        res.status(200).json(solutions);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

module.exports = router;
