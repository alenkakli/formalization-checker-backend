const express = require('express');
const router = express.Router();
const { getUsersByExerciseId, getUserSolutions } = require('../../db/progress');
const { isAdmin } = require('../../helpers/auth');
const {getExercisesByUserName} = require("../../db/progress");
const {getExerciseTitle} = require("../../db/exercises");


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
        let {exercise_id} = req.params;
        exercise_id = parseInt(exercise_id, 10);

        if (isNaN(exercise_id)) {
            res.sendStatus(400).end();
            return;
        }

        // FIXME: Make this transactional
        const exercise = {
            title: await getExerciseTitle(exercise_id),
            users: await getUsersByExerciseId(exercise_id)
        };

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/:exercise_id/:user_name', async (req, res) => {
    try {
        let {user_name, exercise_id} = req.params;
        if (!isAdmin(req) && req.auth.username !== user_name) {
            res.sendStatus(401).end();
            return;
        }

        exercise_id = parseInt(exercise_id, 10);
        if (isNaN(exercise_id)) {
            res.sendStatus(400).end();
            return;
        }

        // FIXME: Make this transactional
        const exercise = {
            title: await getExerciseTitle(exercise_id),
            solutions: await getUserSolutions(user_name, exercise_id)
        };

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

module.exports = router;
