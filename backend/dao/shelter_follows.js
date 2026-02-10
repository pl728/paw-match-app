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
