import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, TextField, Select, Button } from "@radix-ui/themes";
import { createPet } from "../services/pets.js";
import { getMyProfile } from "../services/users.js";

const BREEDS = [
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog", "Bulldog",
  "Poodle", "Beagle", "Rottweiler", "German Shorthaired Pointer", "Dachshund",
  "Pembroke Welsh Corgi", "Australian Shepherd", "Yorkshire Terrier", "Boxer", "Great Dane",
  "Siberian Husky", "Cavalier King Charles Spaniel", "Doberman Pinscher", "Miniature Schnauzer",
  "Shih Tzu", "Boston Terrier", "Bernese Mountain Dog", "Pomeranian", "Havanese", "English Springer Spaniel",
  "Brittany", "Shetland Sheepdog", "Cocker Spaniel", "Border Collie", "Chihuahua",
  "Persian", "Maine Coon", "Ragdoll", "British Shorthair", "Siamese",
  "American Shorthair", "Scottish Fold", "Sphynx", "Bengal", "Abyssinian",
  "Birman", "Oriental Shorthair", "Devon Rex", "Burmese", "Russian Blue", "Mixed Breed"
].sort();

const PET_NAMES = [
  "Mochi", "Biscuit", "Noodle", "Pepper", "Maple", "Clover", "Scout", "Luna",
  "Milo", "Poppy", "Rufus", "Olive", "Pickles", "Sunny", "Juniper", "Teddy"
];

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig", "Hamster", "Other"];
const SEX_OPTIONS = ["Male", "Female", "Unknown"];
const SIZE_OPTIONS = ["small", "medium", "large"];

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildRandomPetForm() {
  const species = randomFrom(SPECIES_OPTIONS);
  const breed = randomFrom(BREEDS);
  const name = randomFrom(PET_NAMES);

  return {
    name,
    species,
    breed,
    age_years: String(Math.floor(Math.random() * 12) + 1),
    sex: randomFrom(SEX_OPTIONS),
    size: randomFrom(SIZE_OPTIONS),
    description: `${name} is a friendly ${species.toLowerCase()} who enjoys attention and would love a new home.`
  };
}

function CreatePet() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    size: "small",
    description: ""
  });

  const [breedSearch, setBreedSearch] = useState("");
  const [checkingShelter, setCheckingShelter] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    async function checkShelter() {
      try {
        const profile = await getMyProfile();
        if (!profile.shelter) {
          navigate('/setup-shelter', { replace: true });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingShelter(false);
      }
    }
    checkShelter();
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleFillRandom() {
    setFormData(buildRandomPetForm());
    setBreedSearch("");
    setPhotoFile(null);
  }

  const filteredBreeds = BREEDS.filter(b =>
    b.toLowerCase().includes(breedSearch.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, v));

      if (photoFile) payload.append("photo", photoFile);

      await createPet(payload);
      navigate('/profile');
    } catch (err) {
      alert(`Error creating pet: ${err.message}`);
    }
  }

  if (checkingShelter) {
    return (
      <div className="setup-container">
        <Text size="2" color="gray">Loading...</Text>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <Card size="4" className="setup-card">
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Add a Pet</Heading>
          <Text size="2" color="gray" align="center">
            Please submit details about this pet to add to the shelter database.
          </Text>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Pet Name</Text>
                <TextField.Root name="name" value={formData.name} onChange={handleChange} required />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Species</Text>
                <Select.Root value={formData.species} onValueChange={(v) => setFormData({...formData, species: v})}>
                  <Select.Trigger className="full-width" />
                  <Select.Content>
                    {SPECIES_OPTIONS.map(s => (
                      <Select.Item key={s} value={s}>{s}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Breed</Text>
                <Select.Root value={formData.breed} onValueChange={(v) => setFormData({...formData, breed: v})}>
                  <Select.Trigger className="full-width" />
                  <Select.Content>
                    <TextField.Root
                      value={breedSearch}
                      onChange={(e) => setBreedSearch(e.target.value)}
                      className="select-search"
                    />
                    <Select.Separator />
                    {filteredBreeds.map(b => (
                      <Select.Item key={b} value={b}>{b}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Age</Text>
                <TextField.Root name="age_years" type="number" value={formData.age_years} onChange={handleChange} />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Sex</Text>
                <Select.Root value={formData.sex} onValueChange={(v) => setFormData({...formData, sex: v})}>
                  <Select.Trigger className="full-width" />
                  <Select.Content>
                    {SEX_OPTIONS.map(s => (
                      <Select.Item key={s} value={s}>{s}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Size</Text>
                <Select.Root value={formData.size} onValueChange={(v) => setFormData({...formData, size: v})}>
                  <Select.Trigger className="full-width" />
                  <Select.Content>
                    {SIZE_OPTIONS.map(s => (
                      <Select.Item key={s} value={s}>{s}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Description</Text>
                <TextField.Root name="description" value={formData.description} onChange={handleChange} />
              </label>

              <input type="file" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />

              <Flex gap="3" mt="3">
                <Button type="button" variant="soft" onClick={handleFillRandom}>
                  Fill random
                </Button>
                <Button type="submit" className="flex-grow">
                  Create Pet
                </Button>
              </Flex>

            </Flex>
          </form>
        </Flex>
      </Card>
    </div>
  );
}

export default CreatePet;