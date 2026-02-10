import mysql from 'mysql2/promise';

var pool;

function getPool() {
    if (pool) {
        return pool;
    }

    if (!process.env.DATABASE_URL) {
        var err = new Error('DATABASE_URL is not set');
        err.code = 'NO_DATABASE_URL';
        throw err;
    }

    pool = mysql.createPool(process.env.DATABASE_URL);
    return pool;
}

var db = {
    query: async function (text, params) {
        var connection = getPool();
        var result = await connection.query(text, params);
        return { rows: result[0] };
    },
    end: async function () {
        if (!pool) {
            return;
        }
        await pool.end();
    }
};

export default db;
