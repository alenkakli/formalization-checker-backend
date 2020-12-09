const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './sqlite.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database.');
});

db.serialize(() => {
  db.each("SELECT * FROM exercises", (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(row);
  });

  db.each("SELECT * FROM formalizations", (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(row);
  });
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database.');
});
