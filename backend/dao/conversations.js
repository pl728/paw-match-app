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
      u.username AS adopter_username,
      s.name AS shelter_name,
      p.name AS pet_name,
      m.body AS last_message,
      m.created_at AS last_message_at,
      c.created_at,
      c.updated_at,

      COUNT(
        CASE
          WHEN unread_messages.read_at IS NULL
            AND unread_messages.sender_user_id != ?
          THEN 1
        END
      ) AS unread_count

    FROM conversations c
    JOIN users u ON u.id = c.adopter_user_id
    JOIN shelters s ON s.id = c.shelter_id
    LEFT JOIN pets p ON p.id = c.pet_id

    LEFT JOIN messages m ON m.id = (
      SELECT m2.id
      FROM messages m2
      WHERE m2.conversation_id = c.id
      ORDER BY m2.created_at DESC
      LIMIT 1
    )

    LEFT JOIN messages unread_messages 
      ON unread_messages.conversation_id = c.id

    WHERE
      (? = 'adopter' AND c.adopter_user_id = ?)
      OR
      (? = 'shelter_admin' AND s.user_id = ?)

    GROUP BY
      c.id,
      c.adopter_user_id,
      c.shelter_id,
      c.pet_id,
      u.username,
      s.name,
      p.name,
      m.body,
      m.created_at,
      c.created_at,
      c.updated_at

    ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `,
    [userId, role, userId, role, userId]
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
    SELECT
      c.*,
      s.name AS shelter_name
    FROM conversations c
    JOIN shelters s ON s.id = c.shelter_id
    WHERE c.id = ?
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
    INSERT INTO messages (id, conversation_id, sender_user_id, body, read_at)
    VALUES (?, ?, ?, ?, NULL)
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

export async function getUnreadCount(userId) {
  const result = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    LEFT JOIN shelters s ON s.id = c.shelter_id
    WHERE m.sender_user_id != ?
      AND m.read_at IS NULL
      AND (
        c.adopter_user_id = ?
        OR s.user_id = ?
      )
    `,
    [userId, userId, userId]
  );

  return Number(result.rows[0].count);
}

export async function markMessagesAsRead(userId, conversationId) {
  await db.query(
    `
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = ?
      AND sender_user_id != ?
      AND read_at IS NULL
    `,
    [conversationId, userId]
  );
}