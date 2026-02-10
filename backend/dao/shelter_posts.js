import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createShelterPost(options) {
    const shelterId = options.shelterId;
    const petId = options.petId || null;
    const type = options.type;
    const title = options.title;
    const body = options.body;
    const publishedAt = options.publishedAt || null;

    const postId = crypto.randomUUID();

    await db.query(
        `INSERT INTO shelter_posts
            (id, shelter_id, pet_id, type, title, body, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [postId, shelterId, petId, type, title, body, publishedAt]
    );

    return getShelterPostById(postId);
}

export async function listShelterPosts(options) {
    const where = [];
    const params = [];

    if (options.shelterId) {
        where.push('sp.shelter_id = ?');
        params.push(options.shelterId);
    }

    if (options.petId) {
        where.push('sp.pet_id = ?');
        params.push(options.petId);
    }

    if (options.publishedOnly) {
        where.push('sp.published_at IS NOT NULL');
    }

    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    const result = await db.query(
        `SELECT
            sp.id, sp.shelter_id, sp.pet_id, sp.type, sp.title, sp.body,
            sp.published_at, sp.created_at, sp.updated_at
         FROM shelter_posts sp
         ${whereSql}
         ORDER BY COALESCE(sp.published_at, sp.created_at) DESC
         LIMIT ? OFFSET ?`,
        [...params, options.limit, options.offset]
    );

    return result.rows;
}

export async function getShelterPostById(postId) {
    const result = await db.query(
        `SELECT
            id, shelter_id, pet_id, type, title, body,
            published_at, created_at, updated_at
         FROM shelter_posts
         WHERE id = ?`,
        [postId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function getShelterPostPublishInfo(postId) {
    const result = await db.query(
        'SELECT id, published_at FROM shelter_posts WHERE id = ?',
        [postId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function publishShelterPost(postId) {
    await db.query(
        `UPDATE shelter_posts
         SET published_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [postId]
    );

    return getShelterPostById(postId);
}
