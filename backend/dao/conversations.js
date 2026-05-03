import db from '../db/index.js';
import crypto from 'node:crypto';

export async function getAllConversations(userId, role) {
  const result = await db.query(
    `
    SELECT
      c.id,
      c.adopter_user_id,
      c.shelter_id,
      c.pet_id,
      s.name AS shelter_name,
      p.name AS pet_name,
      m.body AS last_message,
      m.created_at AS last_message_at,
      c.created_at,
      c.updated_at
    FROM conversations c
    JOIN shelters s ON s.id = c.shelter_id
    LEFT JOIN pets p ON p.id = c.pet_id
    LEFT JOIN messages m ON m.id = (
      SELECT m2.id
      FROM messages m2
      WHERE m2.conversation_id = c.id
      ORDER BY m2.created_at DESC
      LIMIT 1
    )
    WHERE
      (? = 'adopter' AND c.adopter_user_id = ?)
      OR
      (? = 'shelter_admin' AND s.user_id = ?)
    ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `,
    [role, userId, role, userId]
  );

  return result.rows;
}

export async function createConversation({ adopter_user_id, shelter_id, pet_id }) {
  const id = crypto.randomUUID();

  await db.query(
    `
    INSERT INTO conversations (id, adopter_user_id, shelter_id, pet_id)
    VALUES (?, ?, ?, ?)
    `,
    [id, adopter_user_id, shelter_id, pet_id || null]
  );

  const result = await db.query(
    `
    SELECT *
    FROM conversations
    WHERE id = ?
    `,
    [id]
  );

  return result.rows[0];
}

export async function getMessagesByConversationId(conversationId) {
  const result = await db.query(
    `
    SELECT *
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    `,
    [conversationId]
  );

  return result.rows;
}

export async function createMessage({ conversation_id, sender_user_id, body }) {
  const id = crypto.randomUUID();

  await db.query(
    `
    INSERT INTO messages (id, conversation_id, sender_user_id, body)
    VALUES (?, ?, ?, ?)
    `,
    [id, conversation_id, sender_user_id, body]
  );

  const result = await db.query(
    `
    SELECT *
    FROM messages
    WHERE id = ?
    `,
    [id]
  );

  return result.rows[0];
}

