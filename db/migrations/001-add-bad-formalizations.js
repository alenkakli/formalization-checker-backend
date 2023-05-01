const pool = require("../db");
const {
    findEquivalentSolutions
} = require("../exercises");

async function main() {
    await evaluateOldResults();
}

main();

async function evaluateOldResults() {
    const client = await pool.connect();
    const timer = 'processing solutions';
    console.time(timer);
    try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        const solutions = await _getAllSolutions(client);

        if (solutions === null) {
            return;
        }

        console.log('Building equivalence classes of incorrect solutions');
        const len = solutions.length;
        const five_percent = Math.ceil(len / 20);
        console.log(`${len} solutions to process`);
        for (let i = 0; i < len; i++) {
            const solution = solutions[i];
            const solution_id = solution.solution_id;
            const proposition_id = solution.proposition_id;

            const exercise_id = await _getExerciseIDByPropositionID(proposition_id, client);

            const migration = true;
            const {bad_formalization_id, formalization_id} = await findEquivalentSolutions(proposition_id, exercise_id, solution.solution, client, migration);

            await _updateSolution(solution_id, formalization_id, bad_formalization_id, client);

            if (i > 0 && i % five_percent == 0) {
                console.timeLog(timer, `${Math.ceil(100 * i / len)} %`)
            }
        }
        console.timeLog(timer, 'Commiting...');

        await client.query('COMMIT');
        console.timeLog(timer, 'Done');

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release()
        console.timeEnd(timer);
    }
}

const _getAllSolutions = async (client) => {
    const queryText =
        'SELECT * FROM solutions;'
    const res = await client.query(queryText);

    if (res.rows.length < 1) {
        return null;
    }

    return res.rows;
};

const _getExerciseIDByPropositionID = async (proposition_id, client) => {
    const queryText =
        'SELECT * FROM propositions WHERE proposition_id = $1;'
    const res = await client.query(queryText, [ proposition_id ]);

    if (res.rows.length !== 1) {
        return null;
    }

    return res.rows[0].exercise_id;
};

const _updateSolution = async (solution_id, formalization_id, bad_formalization_id, client) => {
    const queryText =
        `UPDATE solutions
         SET formalization_id = $2,
             bad_formalization_id = $3
         WHERE solution_id = $1;`
    const res = await client.query(queryText, [ solution_id, formalization_id, bad_formalization_id ]);

    if (res.rows.length !== 1) {
        return null;
    }

    return res.rows;
};