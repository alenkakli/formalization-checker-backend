const express = require('express');
const router = express.Router();
const {
  ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
} = require('../../config');
const { checkExercise } = require('../../helpers/checks');
const { saveExercise, saveSolution} = require('../../db/saveData');
const {
  getExercisePreviews, getExerciseByID,
  getAllFormalizationsForProposition
} = require('../../db/getData');
const evaluate = require('../../helpers/evaluate');


router.post('/', async (req, res) => {
  try {
    let exercise = req.body;
    if (checkExercise(exercise)) {
      await saveExercise(exercise);
    } else {
      res.sendStatus(400);
      return;
    }

    res.status(201).json(exercise);
    
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

router.get('/', async (req, res) => {
  try {
    const previews = await getExercisePreviews();

    if (!previews) {
      res.sendStatus(404);
      return;
    }

    res.status(200).json(previews);

  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

router.get('/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;
    const parsed_exercise_id = parseInt(exercise_id, 10);
    if (isNaN(parsed_exercise_id)) {
      res.sendStatus(404).end();
      return;
    }

    const exercise = await getExerciseByID(exercise_id);
    if (!exercise) {
      res.sendStatus(404);
      return;
    }
    
    res.status(200).json(exercise);

  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

router.post('/:exercise_id/:proposition_id', async (req, res) => {
  try {
    let { exercise_id, proposition_id } = req.params;
    let { solution, user_id } = req.body;
    exercise_id = parseInt(exercise_id, 10);
    proposition_id = parseInt(proposition_id, 10);
    if (isNaN(exercise_id) || isNaN(proposition_id)) {
      console.error('URL parameters are not numbers.');
      res.sendStatus(400);
      return;
    }

    const formalizations = await getAllFormalizationsForProposition(proposition_id);
    const exercise = await getExerciseByID(exercise_id);
    if (!formalizations || !exercise || formalizations.length === 0) {
      console.error('Missing exercise or formalizations. Cannot evaluate.');
      res.sendStatus(404);
      return;
    }
    if(isNaN(parseInt(user_id))){
      console.error('Missing log in user');
      res.sendStatus(404);
      return;
    }

    try {

      function saveSolutionWithResult (eval_status)  {
        if(eval_status.solutionToFormalization === 'OK' && eval_status.formalizationToSolution === 'OK'){
          saveSolution(user_id, proposition_id, solution, true);
        }
        else{
          saveSolution(user_id, proposition_id, solution, false);
        }
      }
      evaluate(solution, formalizations, exercise, res, saveSolutionWithResult );

    } catch (err) {
      console.error(err.message);
      res.sendStatus(400);
    }
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});


module.exports = router;
