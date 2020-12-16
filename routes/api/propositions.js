const express = require('express');
const router = express.Router();
const { saveProposition } = require('../../db/saveData');
const {
  getAllPropositionsForExercise, getPropositionByID
} = require('../../db/getData');

router.post('/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;
    const { proposition, formalizations } = req.body;
  
    await saveProposition(exercise_id, proposition, formalizations);

    res.json(req.body);
  } catch (err) {
    console.error(err.stack);
  }
});

router.get('/:exercise_id', async (req, res) => {
  try {
    const { exercise_id } = req.params;

    const rows = await getAllPropositionsForExercise(exercise_id);

    res.json(rows);
  } catch (err) {
    console.error(err.stack);
  }
});

router.get('/:exercise_id/:proposition_id', async (req, res) => {
  try {
    const { proposition_id } = req.params;

    const rows = await getPropositionByID(proposition_id);
    
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
  }
});

module.exports = router;
