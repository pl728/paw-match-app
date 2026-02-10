import { endPool, getPool } from './pool.js';

const db = {
    query: async function (text, params) {
        const connection = getPool();
        const result = await connection.query(text, params);
        return { rows: result[0] };
    },
    end: async function () {
        await endPool();
    }
};

export default db;
