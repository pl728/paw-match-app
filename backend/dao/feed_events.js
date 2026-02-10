import db from '../db/index.js';

export async function listFeedEvents(limit) {
    var result = await db.query(`
        SELECT
            fe.id,
            fe.event_type,
            fe.created_at,
            fe.title,
            fe.body,
            s.id AS shelter_id,
            s.name AS shelter_name,
            p.id AS pet_id,
            p.name AS pet_name,
            p.primary_photo_url
        FROM feed_events fe
        JOIN shelters s ON s.id = fe.shelter_id
        LEFT JOIN pets p ON p.id = fe.pet_id
        ORDER BY fe.created_at DESC
        LIMIT ?
    `, [limit]);

    return result.rows;
}
