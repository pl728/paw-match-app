import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createUser(options) {
    var email = options.email;
    var passwordHash = options.passwordHash;
    var role = options.role || 'adopter';

    var userId = crypto.randomUUID();

    await db.query(
        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [userId, email, passwordHash, role]
    );

    await db.query('INSERT INTO email_notifications (user_id) VALUES (?)', [userId]);

    var result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    return result.rows[0];
}

export async function getUserById(userId) {
    var result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}
