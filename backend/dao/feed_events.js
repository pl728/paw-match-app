import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createFeedEvent(eventType, { shelter_id = null, pet_id = null, post_id = null, payload = null } = {}) {
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO feed_events (id, event_type, shelter_id, pet_id, post_id, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, eventType, shelter_id, pet_id, post_id, payload ? JSON.stringify(payload) : null]
  );
}

export async function listRecentActivity(limit = 25) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));

  const result = await db.query(
    `
    SELECT
      fe.id,
      fe.event_type,
      fe.created_at,
      JSON_UNQUOTE(JSON_EXTRACT(fe.payload, '$.title')) AS title,
      JSON_UNQUOTE(JSON_EXTRACT(fe.payload, '$.body')) AS body,
      JSON_UNQUOTE(JSON_EXTRACT(fe.payload, '$.primaryPhotoUrl')) AS primary_photo_url,
      s.id AS shelter_id,
      s.name AS shelter_name,
      p.id AS pet_id,
      p.name AS pet_name
    FROM feed_events fe
    JOIN shelters s ON s.id = fe.shelter_id
    LEFT JOIN pets p ON p.id = fe.pet_id
    ORDER BY fe.created_at DESC
    LIMIT ?
    `,
    [safeLimit]
  );

  return result.rows;
}
