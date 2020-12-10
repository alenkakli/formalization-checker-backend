const sqlite3 = require('sqlite3').verbose();
const DB_PATH = require('./path');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database.');
});


const save = (data) => {
  db.run(
    `INSERT INTO exercises(constants, predicates, functions, proposition) VALUES(?,?,?,?)`,
    [
      data.constants,
      data.predicates,
      data.functions,
      data.proposition
    ],
    (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log("A row has been inserted.");
    }
  );
};

module.exports = { save };
