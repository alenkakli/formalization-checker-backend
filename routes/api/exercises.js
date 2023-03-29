const express = require('express');
const router = express.Router();
const {checkExercise} = require('../../helpers/checks');
const {
    getExerciseByID, getExerciseByIDWithFormalizations, getExercisePreviews, getExerciseTitle, getPropositionTitle,
    getAllFormalizationsToProposition,
    getBadExercises, getBadPropositionsToExercise, getBadFormalizationsToProposition, getBadFormalizationInfo,
    saveExercise, updateExercise, removeExercise,
    evaluateResult, UserException, ExerciseException
} = require('../../db/exercises');
const {
    getFeedbacksToProposition
} = require('../../db/feedbacks');
const {authAdmin} = require('../../helpers/auth');

router.post('/', authAdmin, async (req, res) => {
    try {
        let exercise = req.body;
        if (checkExercise(exercise)) {
            await saveExercise(exercise);
        }

        res.status(201).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/', async (req, res) => {
    try {
        const previews = await getExercisePreviews();
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

router.post('/edit', authAdmin, async (req, res) => {
    try {
        const exercise = req.body;
        if (!exercise) {
            res.sendStatus(404);
            return;
        }

        await updateExercise(exercise);

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.delete('/remove', authAdmin, async (req, res) => {
    try {
        const exercise = req.body;
        if (!exercise) {
            res.sendStatus(404);
            return;
        }

        await removeExercise(exercise);

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.post('/:exercise_id', async (req, res) => {
    try {
        const {exercise_id} = req.params;
        const user_name = req.body.username;
        const parsed_exercise_id = parseInt(exercise_id, 10);

        if (isNaN(parsed_exercise_id)) {
            res.sendStatus(404).end();
            return;
        }

        const exercise = await getExerciseByID(exercise_id, user_name);
        if (!exercise) {
            res.sendStatus(404);
            return;
        }

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/edit/:exercise_id', authAdmin, async (req, res) => {
    try {
        const {exercise_id} = req.params;
        const parsed_exercise_id = parseInt(exercise_id, 10);

        if (isNaN(parsed_exercise_id)) {
            res.sendStatus(404).end();
            return;
        }

        const exercise = await getExerciseByIDWithFormalizations(parsed_exercise_id);

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.post('/:exercise_id/:proposition_id', async (req, res) => {
    try {
        let {exercise_id, proposition_id} = req.params;
        let {solution, user} = req.body;

        exercise_id = parseInt(exercise_id, 10);
        proposition_id = parseInt(proposition_id, 10);
        if (isNaN(exercise_id) || isNaN(proposition_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const result = await evaluateResult(user, exercise_id, proposition_id, solution);

        res.status(200).json(result);

    } catch (err) {
        if (err instanceof UserException) {
            console.error('Missing log in user');
            res.sendStatus(404);
        }
        if (err instanceof ExerciseException) {
            res.sendStatus(404);
        }
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

// todo, presunut do api/feedback
router.get('/feedback/:proposition_id', async (req, res) => {
    try {
        let {proposition_id} = req.params;
        proposition_id = parseInt(proposition_id, 10);
        if (isNaN(proposition_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const feedbacks = await getFeedbacksToProposition(proposition_id);
        if (feedbacks === null) {
            res.sendStatus(500);
            return;
        }

        res.status(200).json(feedbacks);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/bad_formalizations', async (req, res) => {
    try {
        const exercises = await getBadExercises();
        if (exercises === null) {
            res.sendStatus(500);
            return;
        }
        res.status(200).json(exercises);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});
router.get('/bad_formalizations/:exercise_id', async (req, res) => {
    try {
        let {exercise_id} = req.params;
        exercise_id = parseInt(exercise_id, 10);
        if (isNaN(exercise_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        let exercise = JSON;
        exercise.title1 = await getExerciseTitle(exercise_id);
        exercise.propositions = await getBadPropositionsToExercise(exercise_id);
        if (exercise.propositions === null) {
            res.sendStatus(500);
            return;
        }

        res.status(200).json(exercise);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/bad_formalizations/:exercise_id/:proposition_id', async (req, res) => {
    try {
        let {exercise_id, proposition_id} = req.params;
        exercise_id = parseInt(exercise_id, 10);
        proposition_id = parseInt(proposition_id, 10);

        if (isNaN(exercise_id) || isNaN(proposition_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        let proposition = JSON;
        proposition.title1 = await getExerciseTitle(exercise_id);
        proposition.title2 = await getPropositionTitle(proposition_id);
        proposition.formalizations = await getAllFormalizationsToProposition(proposition_id);
        proposition.bad_formalizations = await getBadFormalizationsToProposition(exercise_id, proposition_id);

        res.status(200).json(proposition);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/bad_formalization/:exercise_id/:bad_formalization_id', async (req, res) => {
    try {
        let {exercise_id, bad_formalization_id} = req.params;
        exercise_id = parseInt(exercise_id, 10);
        bad_formalization_id = parseInt(bad_formalization_id, 10);

        if (isNaN(exercise_id) || isNaN(bad_formalization_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const info = await getBadFormalizationInfo(exercise_id, bad_formalization_id);

        res.status(200).json(info);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});


module.exports = router;