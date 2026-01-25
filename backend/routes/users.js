var express = require('express');
var crypto = require('crypto');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    var email = req.body.email;
    var passwordHash = req.body.password_hash;
    var role = req.body.role || 'adopter';

    if (!email || !passwordHash) {
        return res.status(400).json({ error: 'email and password_hash are required' });
    }

    var userId = crypto.randomUUID();
    try {
        await db.query(
            'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, role]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'email already exists' });
        }
        throw err;
    }

    var result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId]
    );

    res.status(201).json(result.rows[0]);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    var result = await db.query(
        'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?',
        [req.params.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
}));

module.exports = router;
