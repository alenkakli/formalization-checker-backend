DROP TABLE IF EXISTS users CASCADE ;
DROP TABLE  IF EXISTS solutions CASCADE;
DROP TABLE  IF EXISTS formalizations CASCADE ;
DROP TABLE  IF EXISTS propositions CASCADE;
DROP TABLE  IF EXISTS exercises CASCADE;
DROP DATABASE formalization_exercises;

CREATE DATABASE formalization_exercises;

CREATE TABLE exercises(
    exercise_id SERIAL PRIMARY KEY,
    title TEXT,
    description TEXT,
    constants TEXT,
    predicates TEXT,
    functions TEXT,
    constraints TEXT
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
    constraints TEXT,
    proposition_id INTEGER NOT NULL,
    FOREIGN KEY (proposition_id)
    REFERENCES propositions(proposition_id)
    ON DELETE CASCADE
);

CREATE TABLE users(
    github_id INTEGER NOT NULL PRIMARY KEY, --from github
    user_name VARCHAR(256) NOT NULL, -- from github
    is_admin BOOLEAN NOT NULL
);

CREATE TABLE solutions(
    solution_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    solution TEXT,
    is_correct BOOLEAN,
    proposition_id INTEGER NOT NULL,
    date timestamp NOT NULL,
    FOREIGN KEY (proposition_id)
    REFERENCES propositions(proposition_id)
    ON DELETE CASCADE,
    FOREIGN KEY (user_id)
    REFERENCES users(github_id)
    ON DELETE CASCADE
);

