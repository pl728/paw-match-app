import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPetById } from '../dao/pets.js';
import {
    getRecommendationPreferences,
    getRecommendationQueue,
    recordRecommendationInteraction,
    updateRecommendationPreferences
} from '../services/recommendations.js';

const router = express.Router();

function handleServiceError(err, res) {
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    throw err;
}

router.get('/preferences', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const preferences = await getRecommendationPreferences(req.userId);
    res.json(preferences);
}));

router.patch('/preferences', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    try {
        const preferences = await updateRecommendationPreferences(req.userId, req.body || {});
        res.json(preferences);
    } catch (err) {
        return handleServiceError(err, res);
    }
}));

router.get('/queue', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const result = await getRecommendationQueue(req.userId, req.query.limit);
    res.json({
        items: result.items,
        preferences: result.preferences,
        limit: Math.max(1, Math.min(Number(req.query.limit) || 20, 50))
    });
}));

router.post('/interactions', requireAuth, requireRole('adopter'), asyncHandler(async function (req, res) {
    const petId = req.body.pet_id;
    const interactionType = req.body.interaction_type;

    if (!petId) {
        return res.status(400).json({ error: 'pet_id is required' });
    }

    const pet = await getPetById(petId);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    try {
        await recordRecommendationInteraction(req.userId, petId, interactionType);
    } catch (err) {
        return handleServiceError(err, res);
    }

    res.status(204).end();
}));

export default router;
