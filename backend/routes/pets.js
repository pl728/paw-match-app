import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import {
    createPet,
    listPets,
    getPetById,
    updatePet,
    deletePet
} from '../dao/pets.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {

    const name = req.body.name;
    const species = req.body.species || null;
    const breed = req.body.breed || null;
    const ageYears = req.body.age_years || null;
    const sex = req.body.sex || null;
    const size = req.body.size || null;
    const description = req.body.description || null;
    const status = req.body.status || 'available';

    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }

    const shelter = await getShelterByUserId(req.userId);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const created = await createPet({
        shelterId: shelter.id,
        name: name,
        species: species,
        breed: breed,
        ageYears: ageYears,
        sex: sex,
        size: size,
        description: description,
        status: status
    });
    res.status(201).json(created);
}));

router.get('/', asyncHandler(async function (req, res) {
    const pets = await listPets();
    res.json(pets);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
}));

router.put('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter = await getShelterByUserId(req.userId);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.shelter_id !== shelter.id) {
        return res.status(403).json({ error: 'Not allowed to update this pet' });
    }

    const fields = {
        name: req.body.name,
        species: req.body.species,
        breed: req.body.breed,
        age_years: req.body.age_years,
        sex: req.body.sex,
        size: req.body.size,
        description: req.body.description,
        status: req.body.status
    };

    const hasUpdates = Object.keys(fields).some(function (key) {
        return fields[key] !== undefined;
    });

    if (!hasUpdates) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    const updated = await updatePet(req.params.id, fields);
    if (!updated) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(updated);
}));

router.delete('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter = await getShelterByUserId(req.userId);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.shelter_id !== shelter.id) {
        return res.status(403).json({ error: 'Not allowed to delete this pet' });
    }

    await deletePet(req.params.id);
    res.json({ deleted: true, id: pet.id });
}));

export default router;
