import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { getEmailNotifications, updateEmailNotifications } from '../dao/email_notifications.js';

const router = express.Router();

const ALLOWED_DIGEST_FREQUENCIES = [
    'immediately',
    'daily',
    'weekly',
    'monthly',
    'none'
];

// Returns the user's email notification preferences.
 router.get('/:userId', asyncHandler(async function (req, res) {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const preferences = await getEmailNotifications(userId);
    if (!preferences) {
        return res.status(404).json({ error: 'Notification preferences not found' });
    }

    res.json(preferences);
}));

// Updates one or more email notification preferences.
router.patch('/:userId', asyncHandler(async function (req, res) {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const updates = {};

    if (typeof req.body.adoption_updates === 'boolean') {
        updates.adoption_updates = req.body.adoption_updates;
    }

    if (typeof req.body.new_match_alerts === 'boolean') {
        updates.new_match_alerts = req.body.new_match_alerts;
    }

    if (typeof req.body.saved_animal_updates === 'boolean') {
        updates.saved_animal_updates = req.body.saved_animal_updates;
    }

    if (typeof req.body.reminders === 'boolean') {
        updates.reminders = req.body.reminders;
    }

    if (req.body.digest_frequency !== undefined) {
        if (!ALLOWED_DIGEST_FREQUENCIES.includes(req.body.digest_frequency)) {
            return res.status(400).json({ error: 'Invalid digest_frequency value' });
        }

        updates.digest_frequency = req.body.digest_frequency;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const result = await updateEmailNotifications(userId, updates);
    if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: 'Notification preferences not found' });
    }

    const updated = await getEmailNotifications(userId);
    res.json(updated);
}));

export default router;
