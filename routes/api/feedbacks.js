const express = require('express');
const {saveFeedback, updateFeedback, saveFeedbackToSolution, updateFeedbackRating,
    getAllFeedbacks, getActiveFeedbacks, getFeedbackRating, getUsersToFeedbackLikes, getUsersToFeedbackDislikes,
    getUsersToFeedback
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
        if (feedbacks && feedbacks.length >= 1) {
            for (let i=0; i < feedbacks.length; i++) {
                feedbacks[i].likes_users = await getUsersToFeedbackLikes(feedbacks[i].feedback_id);
                feedbacks[i].dislikes_users = await getUsersToFeedbackDislikes(feedbacks[i].feedback_id);
                feedbacks[i].shown_users = await getUsersToFeedback(feedbacks[i].feedback_id);
            }
        }

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


router.get('/rating/:solution_id/:feedback_id', async (req, res) => {
    try {
        let {solution_id, feedback_id} = req.params;
        solution_id = parseInt(solution_id, 10);
        feedback_id = parseInt(feedback_id, 10);

        if (isNaN(solution_id) || isNaN(feedback_id)) {
            console.error('URL parameters are not numbers.');
            res.sendStatus(400);
            return;
        }

        const rating = await getFeedbackRating(solution_id, feedback_id);


        res.status(200).json(rating);

    } catch (err) {
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
    }

});
module.exports = router;
