import db from '../db/index.js';

export async function getEmailNotifications(userId) {
    const result = await db.query(
        `SELECT
            user_id,
            adoption_updates,
            new_match_alerts,
            saved_animal_updates,
            reminders,
            digest_frequency,
            digest_last_sent,
            created_at,
            updated_at
         FROM email_notifications
         WHERE user_id = ?`,
        [userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function updateEmailNotifications(userId, updates) {
    const setClauses = [];
    const params = [];

    Object.keys(updates).forEach(function (key) {
        setClauses.push(key + ' = ?');
        params.push(updates[key]);
    });

    if (setClauses.length === 0) {
        return null;
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const result = await db.query(
        `UPDATE email_notifications
         SET ${setClauses.join(', ')}
         WHERE user_id = ?`,
        [...params, userId]
    );

    return result.rows;
}
