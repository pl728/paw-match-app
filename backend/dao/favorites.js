import db from '../db/index.js';

export async function addFavorite(userId, petId) {
    await db.query(
        'INSERT IGNORE INTO favorites (user_id, pet_id) VALUES (?, ?)',
        [userId, petId]
    );
}

export async function removeFavorite(userId, petId) {
    await db.query(
        'DELETE FROM favorites WHERE user_id = ? AND pet_id = ?',
        [userId, petId]
    );
}

export async function listFavorites(userId) {
  const result = await db.query(
    'SELECT pet_id FROM favorites WHERE user_id = ?',
    [userId]
  );
  return result.rows;
}
