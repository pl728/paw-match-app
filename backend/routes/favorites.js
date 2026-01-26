var express = require('express');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

// Favorite a shelter
router.post('/', asyncHandler(async function (req, res) {
    if (!user_id || !pet_id) {
        return res.status(400).json({ error: 'user_id and pet_id are required' });
    }
   
    var { user_id, pet_id } = req.body;

    await db.query(
        'INSERT IGNORE INTO favorites (user_id, pet_id) VALUES (?, ?)',
        [user_id, pet_id]
    );

    res.status(204).end();
}));

// Unfavorite a shelter
router.delete('/', asyncHandler(async function (req, res) {
    if (!user_id || !pet_id) {
        return res.status(400).json({ error: 'user_id and pet_id are required' });
    }

    var { user_id, pet_id } = req.body;

    await db.query(
        'DELETE FROM favorites WHERE user_id = ? AND pet_id = ?',
        [user_id, pet_id]
    );

    res.status(204).end();
}));
