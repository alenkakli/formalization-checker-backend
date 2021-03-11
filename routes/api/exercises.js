const express = require('express');
const router = express.Router();
const { checkExercise } = require('../../helpers/checks');
const { saveExercise } = require('../../db/saveData');
const {
  getExercisePreviews, getExerciseByID,
  getAllFormalizationsForProposition
} = require('../../db/getData');
const evaluate = require('../../helpers/evaluate');

router.post('/', async (req, res) => {
  try {
    const exercise = req.body;

    if (checkExercise(exercise)) {
      await saveExercise(exercise);
    } else {
      res.status(400).send(exercise);
      return;
    }

    res.status(201).json(exercise);
    
  } catch (err) {
    res.status(503).end();
  }
});

router.get('/', async (req, res) => {
  try {
    const previews = await getExercisePreviews();

    if (!previews) {
      res.status(404).end();
      return;
    }

    res.status(200).json(previews);

  } catch (err) {
    res.status(503).end();
  }
});

router.get('/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;
    
    const parsed_exercise_id = parseInt(exercise_id, 10);
    if (isNaN(parsed_exercise_id)) {
      res.status(400).end();
      return;
    }

    const exercise = await getExerciseByID(exercise_id);
    if (!exercise) {
      res.status(404).end();
      return;
    }
    
    res.status(200).json(exercise);

  } catch (err) {
    res.status(503).end();
  }
});

router.get('/:exercise_id/:proposition_id', async (req, res) => {
  try {
    let { exercise_id, proposition_id } = req.params;
    let { solution } = req.body;
    
    exercise_id = parseInt(exercise_id, 10);
    proposition_id = parseInt(proposition_id, 10);
    if (isNaN(exercise_id) || isNaN(proposition_id)) {
      res.status(400).end();
      return;
    }

    const formalizations = await getAllFormalizationsForProposition(proposition_id);
    const exercise = await getExerciseByID(exercise_id);
    if (!formalizations || !exercise) {
      res.status(404).end();
      return;
    }

    let result = null;
    try {
      result = evaluate(solution, formalizations, exercise);
    } catch (err) {
      console.error(err.message);
      res.status(400).end();
    }
    
    res.status(200).json(result);

  } catch (err) {
    res.status(503).end();
  }
});

module.exports = router;
