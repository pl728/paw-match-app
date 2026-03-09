import db from '../db/index.js';

export async function followShelter(userId, shelterId) {
    await db.query(
        'INSERT IGNORE INTO shelter_follows (user_id, shelter_id) VALUES (?, ?)',
        [userId, shelterId]
    );
}

export async function unfollowShelter(userId, shelterId) {
    await db.query(
        'DELETE FROM shelter_follows WHERE user_id = ? AND shelter_id = ?',
        [userId, shelterId]
    );
}

export async function listFollowedShelterIds(userId) {
    const result = await db.query(
        'SELECT shelter_id FROM shelter_follows WHERE user_id = ? ORDER BY shelter_id ASC',
        [userId]
    );

    return result.rows.map(function (row) {
        return row.shelter_id;
    });
}
