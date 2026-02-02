var express = require('express');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

var ALLOWED_DIGEST_FREQUENCIES = [
    'immediately',
    'daily',
    'weekly',
    'monthly',
    'none'
];

// Returns the user's email notification preferences.
 router.get('/:userId', asyncHandler(async function (req, res) {
    var userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    var result = await db.query(
        `SELECT
            user_id,
            adoption_updates,
            new_match_alerts,
            saved_animal_updates,
            reminders,
            digest_frequency,
            digest_last_sent,
            created_at,
            updated_at
         FROM email_notifications
         WHERE user_id = ?`,
        [userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification preferences not found' });
    }

    res.json(result.rows[0]);
}));

// Updates one or more email notification preferences.
router.patch('/:userId', asyncHandler(async function (req, res) {
    var userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    var setClauses = [];
    var params = [];

    if (typeof req.body.adoption_updates === 'boolean') {
        setClauses.push('adoption_updates = ?');
        params.push(req.body.adoption_updates);
    }

    if (typeof req.body.new_match_alerts === 'boolean') {
        setClauses.push('new_match_alerts = ?');
        params.push(req.body.new_match_alerts);
    }

    if (typeof req.body.saved_animal_updates === 'boolean') {
        setClauses.push('saved_animal_updates = ?');
        params.push(req.body.saved_animal_updates);
    }

    if (typeof req.body.reminders === 'boolean') {
        setClauses.push('reminders = ?');
        params.push(req.body.reminders);
    }

    if (req.body.digest_frequency !== undefined) {
        if (!ALLOWED_DIGEST_FREQUENCIES.includes(req.body.digest_frequency)) {
            return res.status(400).json({ error: 'Invalid digest_frequency value' });
        }

        setClauses.push('digest_frequency = ?');
        params.push(req.body.digest_frequency);
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    var result = await db.query(
        `UPDATE email_notifications
         SET ${setClauses.join(', ')}
         WHERE user_id = ?`,
        [...params, userId]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Notification preferences not found' });
    }

    var updated = await db.query(
        `SELECT
            user_id,
            adoption_updates,
            new_match_alerts,
            saved_animal_updates,
            reminders,
            digest_frequency,
            digest_last_sent,
            created_at,
            updated_at
         FROM email_notifications
         WHERE user_id = ?`,
        [userId]
    );

    res.json(updated.rows[0]);
}));

module.exports = router;
