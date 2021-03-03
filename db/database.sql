CREATE DATABASE formalization_exercises;

CREATE TABLE exercises(
  exercise_id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  constants TEXT,
  predicates TEXT,
  functions TEXT
);

CREATE TABLE propositions(
  proposition_id SERIAL PRIMARY KEY,
  proposition TEXT,
  exercise_id INTEGER NOT NULL,
  FOREIGN KEY (exercise_id)
    REFERENCES exercises(exercise_id)
      ON DELETE CASCADE
);

CREATE TABLE formalizations(
  formalization_id SERIAL PRIMARY KEY,
  formalization TEXT,
  proposition_id INTEGER NOT NULL,
  FOREIGN KEY (proposition_id)
    REFERENCES propositions(proposition_id)
      ON DELETE CASCADE
);
