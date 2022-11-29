const pool = require('./db');

const getExerciseByID = async (exercise_id, user_name, client) => {
    try {
        const queryText =
            'SELECT * FROM exercises WHERE exercise_id = $1;';
        const res = await client.query(
            queryText,
            [ exercise_id ]
        );
        let propositions = await getAllPropositionsForExercise(exercise_id, user_name, client);
        if (res.rows.length !== 1 || !propositions) {
            return null;
        }

        let exercise = res.rows[0];
        exercise.propositions = propositions;
        return exercise;

    } catch (err) {
        return null;
    }
};

const getExerciseByIDWithFormalizations = async (exercise_id, client) => {
    try {
        const queryText =
            'SELECT * FROM exercises WHERE exercise_id = $1;';
        const res = await client.query(
            queryText,
            [ exercise_id ]
        );

        let propositions = await getAllPropositionsForExercise(exercise_id, null, client);
        if (res.rows.length !== 1 || !propositions) {
            return null;
        }

        let exercise = res.rows[0];
        for(let i = 0; i < propositions.length; i++){
            propositions[i].formalization = await getAllFormalizationsForProposition(propositions[i].proposition_id, client);
        }

        exercise.propositions = propositions;

        return exercise;

    } catch (err) {
        return null;
    }
};

const getExercisePreviews = async (client) => {
    try {
        const queryText =
            `SELECT e.exercise_id, e.title , count(DISTINCT(s.user_id)) as attempted  
            FROM (exercises as e INNER JOIN propositions as p ON e.exercise_id = p.exercise_id )  
                LEFT JOIN solutions as s ON s.proposition_id = p.proposition_id GROUP BY e.exercise_id;`;
        const res = await client.query(queryText);

        return res.rows;

    } catch (err) {
        console.error(err);
        return null;
    }
};

const getAllPropositionsForExercise = async (exercise_id, user_name, client) => {
    try {
        const queryText =
            `SELECT p.proposition_id, p.proposition, 
                (SELECT s.solution FROM solutions as s 
                    LEFT JOIN users as u ON s.user_id = u.github_id  
                    WHERE s.proposition_id = p.proposition_id AND u.user_name = $2 
                    ORDER BY date DESC LIMIT 1) 
            FROM propositions as p WHERE p.exercise_id = $1 ORDER BY p.proposition_id;`
        const res = await client.query(
            queryText,
            [ exercise_id, user_name ]
        );

        if (res.rows.length === 0) {
            return null;
        }

        return res.rows;

    } catch (err) {
        return null;
    }
};

const getAllFormalizationsForProposition = async (proposition_id, client) => {
    try {
        const queryText =
            'SELECT * FROM formalizations WHERE proposition_id = $1;';
        const res = await client.query(
            queryText,
            [ proposition_id ]
        );

        if (res.rows.length === 0) {
            return null;
        }

        return res.rows;

    } catch (err) {
        return null;
    }
};


const saveExercise = async (
    { title, description, constants, predicates, functions, propositions, constraint }, connection
) => {
    try {
        const queryText =
            `INSERT INTO exercises(title, description, constants, predicates, functions, constraints)
            VALUES($1, $2, $3, $4, $5, $6) RETURNING exercise_id;`
        const res = await connection.query(
            queryText,
            [ title, description, constants, predicates, functions, constraint ]
        );

        const exerciseID = res.rows[0].exercise_id;

        propositions.forEach(p => {
            saveProposition(exerciseID, p, connection);
        });

    } catch (err) {
        console.error(err.stack);
    }
};

const saveProposition = async (exerciseID, { proposition, formalizations, constraints }, connection) => {
    try {
        const queryText =
            `INSERT INTO propositions(proposition, exercise_id)
            VALUES($1, $2) RETURNING proposition_id;`;
        const res = await connection.query(
            queryText,
            [ proposition, exerciseID ]
        );

        const propositionID = res.rows[0].proposition_id;

        for(let i = 0; i < formalizations.length; i++){
            saveFormalization(propositionID, formalizations[i], constraints[i], connection);
        }

    } catch (err) {
        console.error(err.stack);
    }
};

const saveFormalization = async (propositionID, formalization, constraint, connection) => {
    try {
        const queryText =
            `INSERT INTO formalizations(formalization, constraints, proposition_id)
            VALUES($1, $2, $3);`;
        await connection.query(
            queryText,
            [ formalization, constraint, propositionID ]
        );

    } catch (err) {
        console.error(err.stack);
    }
};

const saveSolution = async (studentID, propositionID, studentSolution, correctSolution, client) => {
    try {
        const queryText =
            `INSERT INTO solutions(user_id, proposition_id, solution, is_correct, date) 
            VALUES($1, $2, $3, $4, NOW()::timestamp) returning solution_id;`;
        await client.query(
            queryText,
            [ studentID, propositionID, studentSolution, correctSolution ]
        );

    } catch (err) {
        console.error(err.stack);
    }
};

const updateExercise = async (exercise, client) => {
    try {
        const queryText =
            `UPDATE exercises SET title = $2, description = $3, constants = $4, predicates = $5, functions = $6, constraints = $7
            WHERE  exercise_id = $1;`;
        await client.query(
            queryText,
            [ exercise.id, exercise.title, exercise.description, exercise.constants, exercise.predicates, exercise.functions, exercise.constraint,]
        );
        await removeProposition(exercise.id, client);
        for(let i = 0; i < exercise.propositions.length; i++){
            await saveProposition(exercise.id,
                {"proposition": exercise.propositions[i].proposition,
                    "formalizations": exercise.propositions[i].formalizations, "constraints": exercise.propositions[i].constraints}, client)
        }

    } catch (err) {
        console.error(err.stack);
    }
};

const removeExercise = async (exercise, client) => {
    try {
        const queryText =
            'DELETE FROM exercises WHERE exercise_id = $1;';
        await client.query(
            queryText,
            [ exercise.id]
        );
    } catch (err) {
        console.error(err.stack);
    }
};

const removeProposition = async (exercise_id) => {
    try {
        const queryText =
            'DELETE FROM propositions WHERE exercise_id = $1;';
        await pool.query(
            queryText,
            [ exercise_id]
        );
    } catch (err) {
        console.error(err.stack);
    }
};


module.exports = {
    getExercisePreviews,
    getExerciseByID,
    getAllFormalizationsForProposition,
    getExerciseByIDWithFormalizations,
    saveExercise,
    saveSolution,
    updateExercise,
    removeProposition,
    removeExercise
};