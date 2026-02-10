import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createShelter, getShelterById, updateShelter } from '../dao/shelters.js';

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

    try {
        var created = await createShelter({
            userId: userId,
            name: name,
            description: description,
            phone: phone,
            email: email,
            addressLine1: addressLine1,
            addressLine2: addressLine2,
            city: city,
            state: state,
            postalCode: postalCode
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'shelter already exists for user' });
        }
        throw err;
    }

    res.status(201).json(created);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    var shelter = await getShelterById(req.params.id);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found' });
    }
    res.json(shelter);
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

    var hasUpdates = Object.keys(fields).some(function (key) {
        return fields[key] !== undefined;
    });

    if (!hasUpdates) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    var updated = await updateShelter(req.params.id, fields);
    if (!updated) {
        return res.status(404).json({ error: 'Shelter not found' });
    }

    res.json(updated);
}));

export default router;
