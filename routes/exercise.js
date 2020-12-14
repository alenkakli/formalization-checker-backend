const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const newExercise = {
      constants: req.body.constants,
      predicates: req.body.predicates,
      functions: req.body.functions,
      proposition: req.body.proposition,
      formalizations: req.body.formalizations
    };

    save(newExercise);

    res.json(newExercise);
  } catch (err) {
    console.error(err.message);
  }
});

module.exports = router;
