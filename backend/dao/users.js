import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createUser(options) {
    const email = options.email;
    const passwordHash = options.passwordHash;
    const role = options.role || 'adopter';

    const userId = crypto.randomUUID();

    await db.query(
        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, email, passwordHash, role]
    );

    await db.query('INSERT INTO email_notifications (user_id) VALUES (?)', [userId]);

    const result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    return result.rows[0];
}

export async function getUserById(userId) {
    const result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserByEmail(email) {
    const result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE email = ?',
        [email]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserAuthByEmail(email) {
    const result = await db.query(
        'SELECT id, email, role, password_hash FROM users WHERE email = ?',
        [email]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}
