var express = require('express');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    var userId = req.body.user_id;
    var name = req.body.name;
    var description = req.body.description || null;
    var phone = req.body.phone || null;
    var email = req.body.email || null;
    var addressLine1 = req.body.address_line1 || null;
    var addressLine2 = req.body.address_line2 || null;
    var city = req.body.city || null;
    var state = req.body.state || null;
    var postalCode = req.body.postal_code || null;

    if (!userId || !name) {
        return res.status(400).json({ error: 'user_id and name are required' });
    }

    var result;
    try {
        result = await db.query(
            'INSERT INTO shelters (user_id, name, description, phone, email, address_line1, address_line2, city, state, postal_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [userId, name, description, phone, email, addressLine1, addressLine2, city, state, postalCode]
        );
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'shelter already exists for user' });
        }
        throw err;
    }

    res.status(201).json(result.rows[0]);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    var result = await db.query('SELECT * FROM shelters WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Shelter not found' });
    }
    res.json(result.rows[0]);
}));

router.put('/:id', asyncHandler(async function (req, res) {
    var fields = {
        name: req.body.name,
        description: req.body.description,
        phone: req.body.phone,
        email: req.body.email,
        address_line1: req.body.address_line1,
        address_line2: req.body.address_line2,
        city: req.body.city,
        state: req.body.state,
        postal_code: req.body.postal_code
    };

    var setClauses = [];
    var values = [];
    var index = 1;

    Object.keys(fields).forEach(function (key) {
        if (fields[key] !== undefined) {
            setClauses.push(key + ' = $' + index);
            values.push(fields[key]);
            index += 1;
        }
    });

    if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    values.push(req.params.id);

    var query = 'UPDATE shelters SET ' + setClauses.join(', ') + ', updated_at = now() WHERE id = $' + index + ' RETURNING *';
    var result = await db.query(query, values);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Shelter not found' });
    }

    res.json(result.rows[0]);
}));

module.exports = router;
