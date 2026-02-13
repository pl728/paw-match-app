import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createUser(options) {
    const username = options.username;
    const passwordHash = options.passwordHash;
    const role = options.role || 'adopter';

    const userId = crypto.randomUUID();

    await db.query(
        'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, username, passwordHash, role]
    );

    await db.query('INSERT INTO email_notifications (user_id) VALUES (?)', [userId]);

    const result = await db.query(
        'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    return result.rows[0];
}

export async function getUserById(userId) {
    const result = await db.query(
        'SELECT id, username, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserByUsername(username) {
    const result = await db.query(
        'SELECT id, username, role, created_at, updated_at FROM users WHERE username = ?',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserAuthByUsername(username) {
    const result = await db.query(
        'SELECT id, username, role, password_hash FROM users WHERE username = ?',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}
