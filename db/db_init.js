const sqlite3 = require('sqlite3').verbose();
const DB_PATH = require('./path');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS exercises ("
      + "exercise_id INTEGER PRIMARY KEY AUTOINCREMENT,"
      + "constants TEXT,"
      + "predicates TEXT,"
      + "functions TEXT"
    + ")",
    (err) => {
      if (err) {
        return console.error(err.message);
      }
    }
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS propositions ("
      + "proposition_id INTEGER PRIMARY KEY AUTOINCREMENT,"
      + "exercise_id INTEGER NOT NULL,"
      + "proposition TEXT,"
      + "FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)"
    + ")",
    (err) => {
      if (err) {
        return console.error(err.message);
      }
    }
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS formalizations ("
      + "proposition_id INTEGER NOT NULL,"
      + "formalization TEXT,"
      + "FOREIGN KEY (proposition_id) REFERENCES propositions(proposition_id)"
    + ")",
    (err) => {
      if (err) {
        return console.error(err.message);
      }
    }
  );
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database.');
});
