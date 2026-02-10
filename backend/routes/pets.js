import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import {
    createPet,
    listPets,
    getPetById,
    getPetId,
    updatePet,
    deletePet
} from '../dao/pets.js';

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

    var created = await createPet({
        shelterId: shelterId,
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
    var pets = await listPets();
    res.json(pets);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    var pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
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

    var hasUpdates = Object.keys(fields).some(function (key) {
        return fields[key] !== undefined;
    });

    if (!hasUpdates) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    var updated = await updatePet(req.params.id, fields);
    if (!updated) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(updated);
}));

router.delete('/:id', asyncHandler(async function (req, res) {
    var petId = await getPetId(req.params.id);
    if (!petId) {
        return res.status(404).json({ error: 'Pet not found' });
    }
    await deletePet(req.params.id);
    res.json({ deleted: true, id: petId });
}));

export default router;
