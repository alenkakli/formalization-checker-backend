const express = require('express');
const {saveFeedback, updateFeedback, saveFeedbackToSolution, updateFeedbackRating,
    getAllFeedbacks, getActiveFeedbacks
} = require("../../db/feedbacks");
const {authAdmin} = require("../../helpers/auth");
const router = express.Router();

router.post('/', authAdmin, async (req, res) => {
    try {
        let user = req.auth.username;
        let {bad_formalization_id, feedback} = req.body;
        bad_formalization_id = parseInt(bad_formalization_id, 10);

        await saveFeedback(user, bad_formalization_id, feedback);

        res.sendStatus(200);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.patch('/:feedback_id', authAdmin, async (req, res) => {
    try {
        let {feedback_id} = req.params;
        let {isActive} = req.body;
        feedback_id = parseInt(feedback_id, 10);

        await updateFeedback(feedback_id, isActive);

        res.sendStatus(200);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/all/bad_formalization/:bad_formalization_id', async (req, res) => {
    try {
        let {bad_formalization_id} = req.params;
        bad_formalization_id = parseInt(bad_formalization_id, 10);

        if (isNaN(bad_formalization_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const feedbacks = await getAllFeedbacks(bad_formalization_id);
        // if (feedbacks === null) {
        //     res.sendStatus(500);
        //     return;
        // }

        res.status(200).json(feedbacks);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.get('/active/bad_formalization/:bad_formalization_id', async (req, res) => {
    try {
        let {bad_formalization_id} = req.params;
        bad_formalization_id = parseInt(bad_formalization_id, 10);

        if (isNaN(bad_formalization_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const feedbacks = await getActiveFeedbacks(bad_formalization_id);

        res.status(200).json(feedbacks);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.post('/rating', async (req, res) => {
    try {
        let {feedback_id, solution_id} = req.body;

        const result = await saveFeedbackToSolution(feedback_id, solution_id);

        res.status(200).json(result);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

router.patch('/rating/:id', async (req, res) => {
    try {
        let {id} = req.params;
        let {rating} = req.body;

        await updateFeedbackRating(id, rating);

        res.sendStatus(200);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});

module.exports = router;
