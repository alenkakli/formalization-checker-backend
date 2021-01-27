const express = require('express');
const router = express.Router();
const { checkExercise } = require('../../helpers/helpers');
const { saveExercise } = require('../../db/saveData');
const {
  getExercisePreviews, getExerciseByID,
  getAllFormalizationsForProposition
} = require('../../db/getData');

router.post('/', async (req, res) => {
  try {
    const exercise = req.body;

    if (checkExercise(exercise)) {
      await saveExercise(exercise);
    } else {
      res.status(400).send('');
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
    const { exercise_id, proposition_id } = req.params;
    
    const parsed_exercise_id = parseInt(exercise_id, 10);
    const parsed_proposition_id = parseInt(proposition_id, 10);
    if (isNaN(parsed_exercise_id) || isNaN(parsed_proposition_id)) {
      res.status(400).end();
      return;
    }

    const formalizations = await getAllFormalizationsForProposition(proposition_id);

    if (!formalizations) {
      res.status(404).end();
      return;
    }
    
    res.status(200).json({ message: "OK" });
  } catch (err) {
    res.status(503).end();
  }
});

module.exports = router;
