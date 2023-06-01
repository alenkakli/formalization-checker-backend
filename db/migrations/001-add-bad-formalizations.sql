CREATE TABLE bad_formalizations(
    bad_formalization_id SERIAL PRIMARY KEY,
    bad_formalization TEXT,
    proposition_id INTEGER NOT NULL,
    FOREIGN KEY (proposition_id)
        REFERENCES propositions(proposition_id)
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
