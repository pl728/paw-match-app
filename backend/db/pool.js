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

    if (process.env.CLOUD_SQL_CONNECTION_NAME) {
        // Cloud Run: connect via Unix socket mounted at /cloudsql/<connection-name>
        const url = new URL(process.env.DATABASE_URL);
        pool = mysql.createPool({
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
        });
    } else {
        // Local dev: plain TCP via DATABASE_URL
        pool = mysql.createPool(process.env.DATABASE_URL);
    }

    return pool;
}

export async function endPool() {
    if (!pool) {
        return;
    }
    await pool.end();
    pool = undefined;
}
