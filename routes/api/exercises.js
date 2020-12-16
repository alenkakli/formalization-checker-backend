const express = require('express');
const router = express.Router();
const { saveExercise } = require('../../db/saveData');
const { getAllExercises } = require('../../db/getData');

router.post('/', async (req, res) => {
  try {
    const {
      constants, predicates, functions, propositions
    } = req.body;
  
    await saveExercise(constants, predicates, functions, propositions);
    
    res.json(req.body);
  } catch (err) {
    console.error(err.stack);
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await getAllExercises();
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
  }
});

module.exports = router;
