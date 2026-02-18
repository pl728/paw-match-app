import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { addFavorite, removeFavorite, listFavorites } from '../dao/favorites.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Favorite a shelter
router.post('/', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const userId = req.userId;
    const petId = req.body.pet_id;

    if (!petId) {
        return res.status(400).json({ error: 'pet_id is required' });
    }

    await addFavorite(userId, petId);
    res.status(204).end();
}));

// Unfavorite a shelter
router.delete('/', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const userId = req.userId;
    const petId = req.body.pet_id;

    if (!petId) {
        return res.status(400).json({ error: 'pet_id is required' });
    }

    await removeFavorite(userId, petId);
    res.status(204).end();
}));

// Get a list of favored shelters
router.get('/', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
  const userId = req.userId;
  const rows = await listFavorites(userId);
  res.json(rows);
}));


export default router;
