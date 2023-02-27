CREATE TABLE bad_formalizations(
    bad_formalization_id SERIAL PRIMARY KEY,
    bad_formalization TEXT,
    proposition_id INTEGER NOT NULL,
    FOREIGN KEY (proposition_id)
        REFERENCES propositions(proposition_id)
    ON DELETE CASCADE
);

CREATE TABLE feedbacks(
    feedback_id SERIAL PRIMARY KEY,
    feedback TEXT,
    bad_formalization_id INTEGER NOT NULL,
    author TEXT,
    active BOOLEAN,
    FOREIGN KEY (bad_formalization_id)
        REFERENCES bad_formalizations(bad_formalization_id)
    ON DELETE CASCADE
);

CREATE TABLE feedback_ratings(
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER NOT NULL,
    solution_id INTEGER NOT NULL,
    rating INTEGER,
    FOREIGN KEY (feedback_id)
        REFERENCES feedbacks(feedback_id)
    ON DELETE CASCADE,
    FOREIGN KEY (solution_id)
        REFERENCES solutions(solution_id)
    ON DELETE CASCADE
);

ALTER TABLE solutions
    ADD COLUMN formalization_id INTEGER DEFAULT null,
    ADD COLUMN bad_formalization_id INTEGER DEFAULT null,
    ADD FOREIGN KEY (formalization_id)
        REFERENCES formalizations(formalization_id)
    ON DELETE CASCADE,
    ADD FOREIGN KEY (bad_formalization_id)
       REFERENCES bad_formalizations(bad_formalization_id)
    ON DELETE CASCADE;
