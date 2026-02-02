var express = require('express');
var crypto = require('crypto');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

// Create a new Post
// If publish === true, published_at is set to NOW(). Otherwise it stays NULL.
router.post('/', asyncHandler(async function (req, res) {
    var shelter_id = req.body.shelter_id;
    var pet_id = req.body.pet_id || null;
    var type = req.body.type;
    var title = req.body.title;
    var body = req.body.body;
    var publish = req.body.publish === true;

    if (!shelter_id || !type || !title || !body) {
        return res.status(400).json({ error: 'shelter_id, type, title, and body are required' });
    }

    var postId = crypto.randomUUID();

    await db.query(
        `INSERT INTO shelter_posts
            (id, shelter_id, pet_id, type, title, body, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [postId, shelter_id, pet_id, type, title, body, publish ? new Date() : null]
    );

    var result = await db.query(
        `SELECT
            id, shelter_id, pet_id, type, title, body,
            published_at, created_at, updated_at
         FROM shelter_posts
         WHERE id = ?`,
        [postId]
    );

    res.status(201).json(result.rows[0]);
}));

/**
 * GET /api/shelter-posts
 * Optional query params:
 *  - shelter_id
 *  - pet_id
 *  - published_only=true|false (default false)
 *  - limit (default 50, max 200)
 *  - offset (default 0)
 */
router.get('/', asyncHandler(async function (req, res) {
    var shelter_id = req.query.shelter_id;
    var pet_id = req.query.pet_id;
    var published_only = String(req.query.published_only || 'false') === 'true';

    var limit = Math.min(Number(req.query.limit) || 50, 200);
    var offset = Math.max(Number(req.query.offset) || 0, 0);

    var where = [];
    var params = [];

    if (shelter_id) {
        where.push('sp.shelter_id = ?');
        params.push(shelter_id);
    }

    if (pet_id) {
        where.push('sp.pet_id = ?');
        params.push(pet_id);
    }

    if (published_only) {
        where.push('sp.published_at IS NOT NULL');
    }

    var whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    var result = await db.query(
        `SELECT
            sp.id, sp.shelter_id, sp.pet_id, sp.type, sp.title, sp.body,
            sp.published_at, sp.created_at, sp.updated_at
         FROM shelter_posts sp
         ${whereSql}
         ORDER BY COALESCE(sp.published_at, sp.created_at) DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    res.json({
        items: result.rows,
        limit: limit,
        offset: offset
    });
}));

/**
 * GET /api/shelter-posts/:id
 */
router.get('/:id', asyncHandler(async function (req, res) {
    var result = await db.query(
        `SELECT
            id, shelter_id, pet_id, type, title, body,
            published_at, created_at, updated_at
         FROM shelter_posts
         WHERE id = ?`,
        [req.params.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
}));

/**
 * PATCH /api/shelter-posts/:id/publish
 * Publishes a post by setting published_at to NOW().
 */
router.patch('/:id/publish', asyncHandler(async function (req, res) {
    var postId = req.params.id;

    var existing = await db.query(
        'SELECT id, published_at FROM shelter_posts WHERE id = ?',
        [postId]
    );

    if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
    }

    if (existing.rows[0].published_at) {
        return res.status(409).json({ error: 'Post is already published' });
    }

    await db.query(
        `UPDATE shelter_posts
         SET published_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [postId]
    );

    var result = await db.query(
        `SELECT
            id, shelter_id, pet_id, type, title, body,
            published_at, created_at, updated_at
         FROM shelter_posts
         WHERE id = ?`,
        [postId]
    );

    res.json(result.rows[0]);
}));

module.exports = router;
