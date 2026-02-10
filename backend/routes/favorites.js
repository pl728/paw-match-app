import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { addFavorite, removeFavorite } from '../dao/favorites.js';

var router = express.Router();

// Favorite a shelter
router.post('/', asyncHandler(async function (req, res) {
    var userId = req.body.user_id;
    var petId = req.body.pet_id;

    if (!userId || !petId) {
        return res.status(400).json({ error: 'user_id and pet_id are required' });
    }

    await addFavorite(userId, petId);
    res.status(204).end();
}));

// Unfavorite a shelter
router.delete('/', asyncHandler(async function (req, res) {
    var userId = req.body.user_id;
    var petId = req.body.pet_id;

    if (!userId || !petId) {
        return res.status(400).json({ error: 'user_id and pet_id are required' });
    }

    await removeFavorite(userId, petId);
    res.status(204).end();
}));

export default router;
