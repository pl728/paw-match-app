import { endPool, getPool } from './pool.js';

var db = {
    query: async function (text, params) {
        var connection = getPool();
        var result = await connection.query(text, params);
        return { rows: result[0] };
    },
    end: async function () {
        await endPool();
    }
};

export default db;
