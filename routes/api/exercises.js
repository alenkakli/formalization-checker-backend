const express = require('express');
const router = express.Router();
const {TOKEN_SECRET
} = require('../../config');
const { checkExercise } = require('../../helpers/checks');
const { saveExercise, saveSolution, saveUser, updateAdmins, updateExercise, removeExercise} = require('../../db/saveData');
const { getUserId, getUser, getUserSolutions, getAllUsers, getExerciseByIDWithFormalizations} = require('../../db/getData');
const { ADMIN_NAME, ADMIN_PASSWORD, CLIENT_ID, CLIENT_SECRET} = require('../../config');
const request = require('request');
const {
  getExercisePreviews, getExerciseByID,
  getAllFormalizationsForProposition,
  getUsersByExerciseId
} = require('../../db/getData');
const evaluate = require('../../helpers/evaluate');
const {json} = require("express");
const jwt = require('jsonwebtoken');
const e = require("express");
const pool = require("../../db/db");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

router.post('/', authenticateJWT, async (req, res) => {
  await pool.connect((err, client, done) => {
    try {
      if(!isAdmin(req.headers.authorization)){
        res.sendStatus(403);
        return;
      }
      let exercise = req.body;
      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        if (checkExercise(exercise)) {
          await saveExercise(exercise, client);
          client.query('COMMIT;', err => {
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

router.get('/', authenticateJWT , async (req, res) => {
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

            if (!previews) {
              client.query('ROLLBACK;', err => {
                if (err) {
                  console.error('Error rolling back client', err.stack)
                }
                done()
              })
              res.sendStatus(404);
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

router.get('/allUsers/:user_name', authenticateJWT , async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const user = req.params.user_name;
      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        const users = await getAllUsers(user, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })
        if (!users) {
          client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
          res.sendStatus(404);
          return;
        }
        res.status(200).json(users);
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

router.post('/allUsers', authenticateJWT , async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      const users = req.body;
      if (!users) {
        res.sendStatus(404);
        return;
      }
      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        for (let [key, value] of Object.entries(users)) {
          await updateAdmins(key, value, client);
        }
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })
        res.status(200).json(users);
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

router.post('/edit', authenticateJWT , async (req, res) => {
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

router.post('/edit/remove', authenticateJWT , async (req, res) => {
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

router.post('/:exercise_id', authenticateJWT, async (req, res) => {
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

router.get('/progress/:exercise_id', authenticateJWT, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      if (!isAdmin(req.headers.authorization)) {
        res.sendStatus(403);
        return;
      }
      const {exercise_id} = req.params;
      const parsed_exercise_id = parseInt(exercise_id, 10);
      if (isNaN(parsed_exercise_id)) {
        res.sendStatus(404).end();
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        const users = await getUsersByExerciseId(parsed_exercise_id, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        res.status(200).json(users);
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

router.get('/edit/:exercise_id', authenticateJWT, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      if (!isAdmin(req.headers.authorization)) {
        res.sendStatus(403);
        return;
      }
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

router.get('/progress/user/:user_name/:exercise_id', authenticateJWT, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      if (!isAdmin(req.headers.authorization)) {
        res.sendStatus(403);
        return;
      }
      const {user_name} = req.params;
      const {exercise_id} = req.params;
      const parsed_exercise_id = parseInt(exercise_id, 10);
      if (isNaN(parsed_exercise_id)) {
        res.sendStatus(404).end();
        return;
      }

      client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
        const solutions = await getUserSolutions(user_name, parsed_exercise_id, client);
        client.query('COMMIT;', err => {
          if (err) {
            console.error('Error committing transaction', err.stack)
          }
          done()
        })

        res.status(200).json(solutions);
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

router.post('/:exercise_id/:proposition_id', authenticateJWT, async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      let {exercise_id, proposition_id} = req.params;
      let {solution, user} = req.body;

      client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;', async err => {
        let user_id = await getUserId(user);
        user_id = user_id[0].github_id;
        exercise_id = parseInt(exercise_id, 10);
        proposition_id = parseInt(proposition_id, 10);
        if (isNaN(exercise_id) || isNaN(proposition_id)) {
          await client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
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
            done()
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
            done()
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
          client.query('COMMIT;', err => {
            if (err) {
              console.error('Error committing transaction', err.stack)
            }
            done()
          })
        } catch (err) {
          client.query('ROLLBACK;', err => {
            if (err) {
              console.error('Error rolling back client', err.stack)
            }
            done()
          })
          res.sendStatus(400);
        }
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

router.post('/logIn',  async (req, res) => {
  try {
    let data = req.body;
     if (data.username === ADMIN_NAME && data.password === ADMIN_PASSWORD) {
      const token = generateAccessToken({ username: data.username, isAdmin: true });
      return res.status(200).json({"token": token});
    }
    else {
      console.error("Wrong user name or password")
      res.status(400);
    }

  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});




router.post('/logIn/github/auth' , async (req, res) => {
  await pool.connect(async (err, client, done) => {
    try {
      request.post({
        url: "https://github.com/login/oauth/access_token/?client_id=" + CLIENT_ID +
            "&client_secret=" + CLIENT_SECRET + "&code=" + req.body.code,
        headers: {
          'User-Agent': 'request'
        }

      }, function (error, response, body) {
        request.get({
          url: "https://api.github.com/user",
          headers: {
            'User-Agent': 'request',
            'Authorization': 'token ' + body.split("&")[0].split("=")[1]
          }
        }, async function (error, response, body) {
          body = JSON.parse(body);
          if (body.id !== undefined) {

            client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', async err => {
              await saveUser(body.id, body.login, client);
              let user = await getUser(body.login, client);
              await client.query('COMMIT;', err => {
                if (err) {
                  console.error('Error committing transaction', err.stack)
                }
                done()
              })

              const token = generateAccessToken({username: user[0].user_name, isAdmin: user[0].is_admin});
              res.status(200).json({"token": token});
            }
            )}
        });
      });

    } catch (err) {
      client.query('ROLLBACK;', err => {
        if (err) {
          console.error('Error rolling back client', err.stack)
        }
        done()
      })
      console.error(err.message);
      res.sendStatus(500);
    }
  })
});

function generateAccessToken(user) {
  let oneDay = 24* 3600 * 30;
  return jwt.sign(user, TOKEN_SECRET, { expiresIn: oneDay + 's' });
}



function isAdmin(token) {
  let t = JSON.parse(Buffer.from(token.split(" ")[1].split(".")[1], "base64").toString());
  return t.isAdmin;
}

module.exports = router;
