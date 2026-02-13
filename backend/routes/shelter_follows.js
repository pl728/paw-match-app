import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { followShelter, unfollowShelter } from '../dao/shelter_follows.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Follow a shelter
router.post('/', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const userId = req.userId;
    const shelterId = req.body.shelter_id;

    if (!shelterId) {
        return res.status(400).json({ error: 'shelter_id is required' });
    }

    await followShelter(userId, shelterId);
    res.status(204).end();
}));

// Unfollow a shelter
router.delete('/', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const userId = req.userId;
    const shelterId = req.body.shelter_id;

    if (!shelterId) {
        return res.status(400).json({ error: 'shelter_id is required' });
    }

    await unfollowShelter(userId, shelterId);
    res.status(204).end();
}));

export default router;
