var express = require('express');
var db = require('../db');
var asyncHandler = require('../utils/async-handler');

var router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    var shelterId = req.body.shelter_id;
    var name = req.body.name;
    var species = req.body.species || null;
    var breed = req.body.breed || null;
    var ageYears = req.body.age_years || null;
    var sex = req.body.sex || null;
    var size = req.body.size || null;
    var description = req.body.description || null;
    var status = req.body.status || 'available';

    if (!shelterId || !name) {
        return res.status(400).json({ error: 'shelter_id and name are required' });
    }

    var result = await db.query(
        'INSERT INTO pets (shelter_id, name, species, breed, age_years, sex, size, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [shelterId, name, species, breed, ageYears, sex, size, description, status]
    );
    res.status(201).json(result.rows[0]);
}));

router.get('/', asyncHandler(async function (req, res) {
    var result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, status FROM pets ORDER BY created_at DESC'
    );
    res.json(result.rows);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    var result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, description, status FROM pets WHERE id = $1',
        [req.params.id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(result.rows[0]);
}));

router.put('/:id', asyncHandler(async function (req, res) {
    var fields = {
        name: req.body.name,
        species: req.body.species,
        breed: req.body.breed,
        age_years: req.body.age_years,
        sex: req.body.sex,
        size: req.body.size,
        description: req.body.description,
        status: req.body.status
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

    var query = 'UPDATE pets SET ' + setClauses.join(', ') + ', updated_at = now() WHERE id = $' + index + ' RETURNING *';
    var result = await db.query(query, values);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(result.rows[0]);
}));

router.delete('/:id', asyncHandler(async function (req, res) {
    var result = await db.query('DELETE FROM pets WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pet not found' });
    }
    res.json({ deleted: true, id: result.rows[0].id });
}));

module.exports = router;
