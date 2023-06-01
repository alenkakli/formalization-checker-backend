CREATE TABLE feedbacks(
    feedback_id SERIAL PRIMARY KEY,
    feedback TEXT,
    bad_formalization_id INTEGER NOT NULL,
    author TEXT,
    active BOOLEAN,
    created timestamp,
    FOREIGN KEY (bad_formalization_id)
        REFERENCES bad_formalizations(bad_formalization_id)
    ON DELETE CASCADE
);

CREATE TABLE feedback_to_solution(
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER NOT NULL,
    solution_id INTEGER NOT NULL,
    rating INTEGER DEFAULT NULL check (rating between -1 and 1),
    showed timestamp NOT NULL,
    rated timestamp DEFAULT NULL,
    FOREIGN KEY (feedback_id)
        REFERENCES feedbacks(feedback_id)
    ON DELETE CASCADE,
    FOREIGN KEY (solution_id)
        REFERENCES solutions(solution_id)
    ON DELETE CASCADE
);