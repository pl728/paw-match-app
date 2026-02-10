import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createShelter, getShelterById, updateShelter } from '../dao/shelters.js';

const router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    const userId = req.body.user_id;
    const name = req.body.name;
    const description = req.body.description || null;
    const phone = req.body.phone || null;
    const email = req.body.email || null;
    const addressLine1 = req.body.address_line1 || null;
    const addressLine2 = req.body.address_line2 || null;
    const city = req.body.city || null;
    const state = req.body.state || null;
    const postalCode = req.body.postal_code || null;

    if (!userId || !name) {
        return res.status(400).json({ error: 'user_id and name are required' });
    }

    let created;
    try {
        created = await createShelter({
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
    const shelter = await getShelterById(req.params.id);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found' });
    }
    res.json(shelter);
}));

router.put('/:id', asyncHandler(async function (req, res) {
    const fields = {
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

    const hasUpdates = Object.keys(fields).some(function (key) {
        return fields[key] !== undefined;
    });

    if (!hasUpdates) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    const updated = await updateShelter(req.params.id, fields);
    if (!updated) {
        return res.status(404).json({ error: 'Shelter not found' });
    }

    res.json(updated);
}));

export default router;
