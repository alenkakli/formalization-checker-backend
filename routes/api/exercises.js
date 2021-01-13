const express = require('express');
const router = express.Router();
const { checkExercise } = require('../../helpers/helpers');
const { saveExercise } = require('../../db/saveData');
const {
  getAllExercises, getExerciseByID
} = require('../../db/getData');

router.post('/', async (req, res) => {
  try {
    const exercise = req.body;

    if (checkExercise(exercise)) {
      await saveExercise(exercise);
    } else {
      res.status(400).end();
      return;
    }

    res.status(201).json(exercise);
  } catch (err) {
    console.error(err.stack);
    res.status(503).end();
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await getAllExercises();

    res.status(200).json(rows);
  } catch (err) {
    console.error(err.stack);
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

    const rows = await getExerciseByID(exercise_id);
    if (rows.length != 1) {
      res.status(404).end();
      return;
    }
    
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(503).end();
  }
});

module.exports = router;
