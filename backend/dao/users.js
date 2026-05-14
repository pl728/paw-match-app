import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createUser(options) {
    const username = options.username;
    const passwordHash = options.passwordHash;
    const role = options.role || 'adopter';
    const email = options.email;
    const emailVerifiedAt = options.emailVerifiedAt || null;

    const userId = crypto.randomUUID();

    await db.query(
        'INSERT INTO users (id, username, password_hash, role, email, email_verified_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, username, passwordHash, role, email, emailVerifiedAt]
    );

    await db.query('INSERT INTO email_notifications (user_id) VALUES (?)', [userId]);

    const result = await db.query(
        'SELECT id, username, role, email, email_verified_at, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    return result.rows[0];
}

export async function getUserById(userId) {
    const result = await db.query(
        'SELECT id, username, role, email, email_verified_at, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserByUsername(username) {
    const result = await db.query(
        'SELECT id, username, role, email, email_verified_at, created_at, updated_at FROM users WHERE username = ?',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserAuthByUsername(username) {
    const result = await db.query(
        'SELECT id, username, role, email, email_verified_at, password_hash FROM users WHERE username = ?',
        [username]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getUserRegistrationConflicts({ username, email }) {
    const result = await db.query(
        `SELECT
            MAX(CASE WHEN username = ? THEN 1 ELSE 0 END) AS username_exists,
            MAX(CASE WHEN email = ? THEN 1 ELSE 0 END) AS email_exists
         FROM users
         WHERE username = ? OR email = ?`,
        [username, email, username, email]
    );

    const row = result.rows[0] || {};
    return {
        username: Boolean(row.username_exists),
        email: Boolean(row.email_exists)
    };
}

export async function getUserByUsernameOrEmail(identifier) {
    const result = await db.query(
        'SELECT id, username, role, email, email_verified_at, created_at, updated_at FROM users WHERE username = ? OR email = ? LIMIT 1',
        [identifier, identifier]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function markUserEmailVerified(userId) {
    await db.query(
        'UPDATE users SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP) WHERE id = ?',
        [userId]
    );

    return getUserById(userId);
}

export async function getUsersByFavoritedPet(petId) {
    const result = await db.query(
        `SELECT u.id, u.email FROM users u
         INNER JOIN favorites f ON f.user_id = u.id
         LEFT JOIN email_notifications en ON en.user_id = u.id
         WHERE f.pet_id = ?
           AND u.email IS NOT NULL
           AND (en.saved_animal_updates IS NULL OR en.saved_animal_updates = TRUE)
           AND en.digest_frequency = 'immediately'`,
        [petId]
    );
    return result.rows;
}

export async function getUsersByFollowedShelter(shelterId) {
    const result = await db.query(
        `SELECT u.id, u.email FROM users u
         INNER JOIN shelter_follows sf ON sf.user_id = u.id
         LEFT JOIN email_notifications en ON en.user_id = u.id
         WHERE sf.shelter_id = ?
           AND u.email IS NOT NULL
           AND (en.adoption_updates IS NULL OR en.adoption_updates = TRUE)
           AND en.digest_frequency = 'immediately'`,
        [shelterId]
    );
    return result.rows;
}
