const express = require('express');
const router = express.Router();
const pool = require("../../db/db");
const { checkExercise } = require('../../helpers/checks');
const { getUserId } = require('../../db/users');
const { getExerciseByID, getExerciseByIDWithFormalizations,
  getExercisePreviews, getAllFormalizationsForProposition,
  saveExercise, saveSolution, updateExercise, removeExercise } = require('../../db/exercises');
const { authAdmin } = require('../../helpers/auth');
const evaluate = require('../../helpers/evaluate');

router.post('/', authAdmin, async (req, res) => {
  await pool.connect((err, client, done) => {
    try {

      let exercise = req.body;
      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        if (checkExercise(exercise)) {
          await saveExercise(exercise, client);
          await client.query('COMMIT;', err => {
            if (err) {
              console.error('Error committing transaction', err.stack)
            }
            done()
          })
        } else {
          client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
          res.sendStatus(400);
          return;
        }

        res.status(201).json(exercise);
      });
    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
  })
});

router.get('/', async (req, res) => {
  await pool.connect(async (err, client, done) => {
        try {
          client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
            const previews = await getExercisePreviews(client);
            client.query('COMMIT;', err => {
              if (err) {
                console.error('Error committing transaction', err.stack)
              }
              done()
            })

            if (previews === null) {
              // client.query('ROLLBACK;', err => {
              //   if (err) {
              //     console.error('Error rolling back client', err.stack)
              //   }
              //   done()
              // })
              res.sendStatus(500);
              return;
            }

            res.status(200).json(previews);
          });
        } catch (err) {
          client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
          console.error(err.message);
          res.sendStatus(503);
        }
      }
  )
});

router.post('/edit', authAdmin, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const exercise = req.body;
      if (!exercise) {
        res.sendStatus(404);
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;', async err => {
        await updateExercise(exercise, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        res.status(200).json(exercise);
      });
    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
  })
});

router.delete('/remove', authAdmin, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const exercise = req.body;
      if (!exercise) {
        res.sendStatus(404);
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;', async err => {
        await removeExercise(exercise, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        res.status(200).json(exercise);
      });
    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
  })
});

router.post('/:exercise_id', async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const {exercise_id} = req.params;
      const user_name = req.body.username;
      const parsed_exercise_id = parseInt(exercise_id, 10);

      if (isNaN(parsed_exercise_id)) {
        res.sendStatus(404).end();
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;', async err => {
        const exercise = await getExerciseByID(exercise_id, user_name, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        if (!exercise) {
          client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
          res.sendStatus(404);
          return;
        }
        res.status(200).json(exercise);
      })

    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
  })
});

router.get('/edit/:exercise_id', authAdmin, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const {exercise_id} = req.params;
      const parsed_exercise_id = parseInt(exercise_id, 10);

      if (isNaN(parsed_exercise_id)) {
        res.sendStatus(404).end();
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;', async err => {
        const exercise = await getExerciseByIDWithFormalizations(parsed_exercise_id, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        res.status(200).json(exercise);
      })
    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
  })
});

router.post('/:exercise_id/:proposition_id', async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      let {exercise_id, proposition_id} = req.params;
      let {solution, user} = req.body;

      await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;', async err => {
        let user_id = await getUserId(user);
        user_id = user_id[0].github_id;
        exercise_id = parseInt(exercise_id, 10);
        proposition_id = parseInt(proposition_id, 10);
        if (isNaN(exercise_id) || isNaN(proposition_id)) {
          await client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // done()
          })
          console.error('URL parameters are not numbers.');
          res.sendStatus(400);
          return;
        }

        const formalizations = await getAllFormalizationsForProposition(proposition_id, client);
        let exercise = await getExerciseByID(exercise_id, null,  client);

        if (!formalizations || !exercise || formalizations.length === 0) {
          await client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // done()
          })
          console.error('Missing exercise or formalizations. Cannot evaluate.');
          res.sendStatus(404);
          return;
        }

        if (isNaN(parseInt(user_id))) {
          await client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // done()
          })
          console.error('Missing log in user');
          res.sendStatus(404);
          return;
        }

        try {
          function saveSolutionWithResult(eval_status) {
            if (eval_status.solutionToFormalization === 'OK' && eval_status.formalizationToSolution === 'OK') {
              saveSolution(user_id, proposition_id, solution, true, client);
            } else {
              saveSolution(user_id, proposition_id, solution, false, client);
            }
          }

          await evaluate(solution, formalizations, exercise, res, saveSolutionWithResult);
          await client.query('COMMIT;', err => {
            if (err) {
              console.error('Error committing transaction', err.stack)
            }
            // done()
          })
        } catch (err) {
          await client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            // done()
          })
          res.sendStatus(400);
        }
      })
    } catch (err) {
      await client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        // done()
      })
      console.error(err.message);
      res.sendStatus(503);
    }
    finally {
      done()
    }
  })
});

module.exports = router;
