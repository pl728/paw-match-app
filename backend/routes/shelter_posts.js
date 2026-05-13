import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import {
    createShelterPost,
    listShelterPosts,
    getShelterPostById,
    publishShelterPost,
    updateShelterPost,
    deleteShelterPost
} from '../dao/shelter_posts.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { getUsersByFollowedShelter } from '../dao/users.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../services/email.js';
import { createFeedEvent } from '../dao/feed_events.js';

const router = express.Router();

async function notifyShelterFollowers(shelterId, shelterName, title, body) {
    try {
        const followers = await getUsersByFollowedShelter(shelterId);
        await Promise.allSettled(followers.map(function (u) {
            return sendEmail({
                to: u.email,
                subject: `New post from ${shelterName}: ${title}`,
                body: `<p><strong>${shelterName}</strong> published a new post.</p><h3>${title}</h3><p>${body}</p>`
            });
        }));
    } catch (e) {
        console.error('Failed to send shelter post emails:', e);
    }
}

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

    if (publish) {
        try {
            await createFeedEvent('shelter_post', {
                shelter_id: shelter_id,
                pet_id: pet_id,
                post_id: created.id,
                payload: { title, body, primaryPhotoUrl: null },
            });
        } catch (e) {
            console.error('Failed to create feed event for shelter post:', e);
        }

        await notifyShelterFollowers(shelter_id, shelter.name, title, body);
    }

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

    try {
        await createFeedEvent('shelter_post', {
            shelter_id: existing.shelter_id,
            pet_id: existing.pet_id || null,
            post_id: postId,
            payload: { title: existing.title, body: existing.body, primaryPhotoUrl: null },
        });
    } catch (e) {
        console.error('Failed to create feed event for published post:', e);
    }

    await notifyShelterFollowers(existing.shelter_id, shelter.name, existing.title, existing.body);

    res.json(updated);
}));

/**
 * PATCH /api/shelter-posts/:id
 * Edit a post's title, body, or type.
 */
router.patch('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
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
        return res.status(403).json({ error: 'Not allowed to edit this post' });
    }

    const updates = {};
    if (typeof req.body.title === 'string') updates.title = req.body.title;
    if (typeof req.body.body === 'string') updates.body = req.body.body;
    if (typeof req.body.type === 'string') updates.type = req.body.type;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const updated = await updateShelterPost(postId, updates);
    res.json(updated);
}));

/**
 * DELETE /api/shelter-posts/:id
 */
router.delete('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
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
        return res.status(403).json({ error: 'Not allowed to delete this post' });
    }

    await deleteShelterPost(postId);
    res.status(204).send();
}));

export default router;
