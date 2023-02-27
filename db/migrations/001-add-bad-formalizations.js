const pool = require("../db");
const {
    _getAllFormalizationsForProposition,
    _getExerciseByID,
    _getAllBadFormalizationsForProposition,
    _saveBadFormalization,
    _getFormalizationByPropositionId,
    _evaluate,
    ExerciseException
} = require("../exercises");
const evaluate = require("../../helpers/evaluate");
const evaluateBadFormalization = require("../../helpers/badFormalization");

async function main() {
    console.log("Hello world!");
    await evaluateOldResults();
}

main();

async function evaluateOldResults() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

        const solutions = await _getAllSolutions(client);
        console.log(solutions);
        if (solutions === null) {
            return;
        }

        for (let i = 0; i < solutions.length; i++) {
            const solution = solutions[i];
            const solution_id = solution.solution_id;
            console.log(solution_id);
            const proposition_id = solution.proposition_id;
            const exercise_id = await _getExerciseIDByPropositionID(proposition_id, client);
            const {bad_formalization_id, formalization_id} = await _evaluate(proposition_id, exercise_id, solution, client);
            await _updateSolution(solution_id, formalization_id, bad_formalization_id, client);
        }

        await client.query('COMMIT');

    } catch (e) {
        await client.query('ROLLBACK');
        throw e
    } finally {
        client.release()
    }
};

const _getAllSolutions = async (client) => {
    const queryText =
        'SELECT * FROM solutions;'
    const res = await client.query(queryText);

    if (res.rows.length < 1) {
        return null;
    }

    console.log("getAllSolutions res.rows[0] = ")
    console.log(res.rows[0]);
    return res.rows;
};

const _getExerciseIDByPropositionID = async (proposition_id, client) => {
    const queryText =
        'SELECT * FROM propositions WHERE proposition_id = $1;'
    const res = await client.query(
        queryText,
        [ proposition_id ]);

    if (res.rows.length !== 1) {
        return null;
    }

    return res.rows[0];
};

const _updateSolution = async (solution_id, formalization_id, bad_formalization_id, client) => {
    const queryText =
        `UPDATE solutions
         SET formalization_id = $2,
             bad_formalization_id = $3
         WHERE solution_id = $1;`
    const res = await client.query(
        queryText,
        [ solution_id, formalization_id, bad_formalization_id ]);

    if (res.rows.length !== 1) {
        return null;
    }
    return res.rows;
};