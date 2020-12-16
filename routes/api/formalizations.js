const express = require('express');
const router = express.Router();
const { saveFormalization } = require('../../db/saveData');
const {
  getAllFormalizationsForProposition, getFormalizationByID
} = require('../../db/getData');

router.post('/:proposition_id', async (req, res) => {
  try {
    const { proposition_id } = req.params;
    const { formalization } = req.body;
  
    await saveFormalization(proposition_id, formalization);

    res.json(req.body);
  } catch (err) {
    console.error(err.stack);
  }
});

router.get('/:proposition_id', async (req, res) => {
  try {
    const { proposition_id } = req.params;

    const rows = await getAllFormalizationsForProposition(proposition_id);

    res.json(rows);
  } catch (err) {
    console.error(err.stack);
  }
});

router.get('/:proposition_id/:formalization_id', async (req, res) => {
  try {
    const { proposition_id, formalization_id } = req.params;

    const rows = await getFormalizationByID(formalization_id);

    res.json(rows);
  } catch (err) {
    console.error(err.stack);
  }
});

module.exports = router;
