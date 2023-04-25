ALTER TABLE feedback_to_solution
    ALTER COLUMN rated SET DEFAULT NULL;

ALTER TABLE feedback_to_solution
    ALTER COLUMN rated DROP NOT NULL;

ALTER TABLE feedbacks
    ADD COLUMN created timestamp;