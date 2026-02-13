import mysql from 'mysql2/promise';

let pool;

export function getPool() {
    if (pool) {
        return pool;
    }

    if (!process.env.DATABASE_URL) {
        const err = new Error('DATABASE_URL is not set');
        err.code = 'NO_DATABASE_URL';
        throw err;
    }

    pool = mysql.createPool(process.env.DATABASE_URL);
    return pool;
}

export async function endPool() {
    if (!pool) {
        return;
    }
    await pool.end();
    pool = undefined;
}
