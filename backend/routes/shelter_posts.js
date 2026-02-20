import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import {
    createShelterPost,
    listShelterPosts,
    getShelterPostById,
    publishShelterPost
} from '../dao/shelter_posts.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Create a new Post
// If publish === true, published_at is set to NOW(). Otherwise it stays NULL.
router.post('/', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter_id = req.body.shelter_id;
    const pet_id = req.body.pet_id || null;
    const type = req.body.type;
    const title = req.body.title;
    const body = req.body.body;
    const publish = req.body.publish === true;

    if (!shelter_id || !type || !title || !body) {
        return res.status(400).json({ error: 'shelter_id, type, title, and body are required' });
    }

    const shelter = await getShelterByUserId(req.userId);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    if (shelter.id !== shelter_id) {
        return res.status(403).json({ error: 'Not allowed to post for this shelter' });
    }

    const created = await createShelterPost({
        shelterId: shelter_id,
        petId: pet_id,
        type: type,
        title: title,
        body: body,
        publishedAt: publish ? new Date() : null
    });

    res.status(201).json(created);
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
    const shelter_id = req.query.shelter_id;
    const pet_id = req.query.pet_id;
    const published_only = String(req.query.published_only || 'false') === 'true';

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const posts = await listShelterPosts({
        shelterId: shelter_id,
        petId: pet_id,
        publishedOnly: published_only,
        limit: limit,
        offset: offset
    });

    res.json({
        items: posts,
        limit: limit,
        offset: offset
    });
}));

/**
 * GET /api/shelter-posts/:id
 */
router.get('/:id', asyncHandler(async function (req, res) {
    const post = await getShelterPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
}));

/**
 * PATCH /api/shelter-posts/:id/publish
 * Publishes a post by setting published_at to NOW().
 */
router.patch('/:id/publish', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const postId = req.params.id;

    const shelter = await getShelterByUserId(req.userId);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const existing = await getShelterPostById(postId);
    if (!existing) {
        return res.status(404).json({ error: 'Post not found' });
    }

    if (existing.shelter_id !== shelter.id) {
        return res.status(403).json({ error: 'Not allowed to publish this post' });
    }

    if (existing.published_at) {
        return res.status(409).json({ error: 'Post is already published' });
    }

    const updated = await publishShelterPost(postId);
    res.json(updated);
}));

export default router;
