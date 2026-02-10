import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { followShelter, unfollowShelter } from '../dao/shelter_follows.js';

var router = express.Router();

// Follow a shelter
router.post('/', asyncHandler(async function (req, res) {
    var userId = req.body.user_id;
    var shelterId = req.body.shelter_id;

    if (!userId || !shelterId) {
        return res.status(400).json({ error: 'user_id and shelter_id are required' });
    }

    await followShelter(userId, shelterId);
    res.status(204).end();
}));

// Unfollow a shelter
router.delete('/', asyncHandler(async function (req, res) {
    var userId = req.body.user_id;
    var shelterId = req.body.shelter_id;

    if (!userId || !shelterId) {
        return res.status(400).json({ error: 'user_id and shelter_id are required' });
    }

    await unfollowShelter(userId, shelterId);
    res.status(204).end();
}));

export default router;
