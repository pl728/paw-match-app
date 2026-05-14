import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createShelter, getShelterById, updateShelter, listShelters, deleteShelter, getShelterByUserId } from '../dao/shelters.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { geocodeLocation } from '../services/geocoding.js';

const router = express.Router();

router.get('/', asyncHandler(async function (req, res) {
    const shelters = await listShelters();
    res.json(shelters);
}));

router.post('/', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const userId = req.userId;
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

    let coordinates = null;
    try {
        coordinates = await geocodeLocation({
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
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
            postalCode: postalCode,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude
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

router.put('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const existing = await getShelterById(req.params.id);
    if (!existing) {
        return res.status(404).json({ error: 'Shelter not found' });
    }

    if (existing.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not allowed to update this shelter' });
    }

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

    if (
        req.body.address_line1 !== undefined ||
        req.body.address_line2 !== undefined ||
        req.body.city !== undefined ||
        req.body.state !== undefined ||
        req.body.postal_code !== undefined ||
        req.body.latitude !== undefined ||
        req.body.longitude !== undefined
    ) {
        try {
            const coordinates = await geocodeLocation({
                addressLine1: req.body.address_line1 ?? existing?.address_line1,
                addressLine2: req.body.address_line2 ?? existing?.address_line2,
                city: req.body.city ?? existing?.city,
                state: req.body.state ?? existing?.state,
                postalCode: req.body.postal_code ?? existing?.postal_code,
                latitude: req.body.latitude,
                longitude: req.body.longitude
            });
            fields.latitude = coordinates?.latitude ?? null;
            fields.longitude = coordinates?.longitude ?? null;
            fields.geocoded_at = coordinates ? new Date() : null;
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

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

router.delete('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter = await getShelterById(req.params.id);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found' });
    }

    // Check if user owns this shelter
    const userShelter = await getShelterByUserId(req.userId);
    if (!userShelter || userShelter.id !== req.params.id) {
        return res.status(403).json({ error: 'Not allowed to delete this shelter' });
    }

    await deleteShelter(req.params.id);
    res.json({ deleted: true, id: req.params.id });
}));

export default router;
