var express = require('express');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

// Follow a shelter
router.post('/', asyncHandler(async function (req, res) {
    if (!user_id || !shelter_id) {
        return res.status(400).json({ error: 'user_id and shelter_id are required' });
    }

    var { user_id, shelter_id } = req.body;

    await db.query(
        'INSERT IGNORE INTO shelter_follows (user_id, shelter_id) VALUES (?, ?)',
        [user_id, shelter_id]
    );

    res.status(204).end();
}));

// Unfollow a shelter
router.delete('/', asyncHandler(async function (req, res) {
    if (!user_id || !shelter_id) {
        return res.status(400).json({ error: 'user_id and shelter_id are required' });
    }

    var { user_id, shelter_id } = req.body;

    await db.query(
        'DELETE FROM shelter_follows WHERE user_id = ? AND shelter_id = ?',
        [user_id, shelter_id]
    );

    res.status(204).end();
}));

module.exports = router;
