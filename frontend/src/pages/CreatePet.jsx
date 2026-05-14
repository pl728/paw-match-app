import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, TextField, Select, Button } from "@radix-ui/themes";
import { createPet } from "../services/pets.js";
import { getMyProfile } from "../services/users.js";

const BREEDS_BY_SPECIES = {
  Dog: [
    "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
    "Bulldog", "Poodle", "Beagle", "Rottweiler", "Dachshund", "Corgi",
    "Australian Shepherd", "Yorkshire Terrier", "Boxer", "Great Dane",
    "Siberian Husky", "Doberman Pinscher", "Shih Tzu", "Boston Terrier",
    "Pomeranian", "Chihuahua", "Mixed Breed", "Other"
  ],

  Cat: [
    "Persian", "Maine Coon", "Ragdoll", "British Shorthair", "Siamese",
    "American Shorthair", "Scottish Fold", "Sphynx", "Bengal", "Abyssinian",
    "Russian Blue", "Mixed Breed", "Other"
  ],

  Bird: [
    "Parakeet", "Cockatiel", "Canary", "Lovebird", "Macaw", "Cockatoo",
    "African Grey Parrot", "Conure", "Finch", "Budgie", "Mixed Breed", "Other"
  ],

  Rabbit: [
    "Holland Lop", "Netherland Dwarf", "Mini Rex", "Lionhead",
    "Flemish Giant", "Dutch Rabbit", "Mixed Breed", "Other"
  ],

  "Guinea Pig": [
    "American Guinea Pig", "Abyssinian Guinea Pig", "Peruvian Guinea Pig",
    "Teddy Guinea Pig", "Skinny Pig", "Mixed Breed", "Other"
  ],

  Hamster: [
    "Syrian Hamster", "Dwarf Hamster", "Roborovski Hamster",
    "Chinese Hamster", "Mixed Breed", "Other"
  ],

  Other: [
    "Ferret", "Chinchilla", "Hedgehog", "Mouse", "Rat", "Gerbil",
    "Turtle", "Lizard", "Snake", "Mixed Breed", "Other"
  ]
};

const PET_NAMES = [
  "Mochi", "Biscuit", "Noodle", "Pepper", "Maple", "Clover", "Scout", "Luna",
  "Milo", "Poppy", "Rufus", "Olive", "Pickles", "Sunny", "Juniper", "Teddy"
];

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig", "Hamster", "Other"];
const SEX_OPTIONS = ["Male", "Female", "Unknown"];
const SIZE_OPTIONS = ["small", "medium", "large"];
const MAX_PHOTOS = 10;

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildRandomPetForm() {
  const species = randomFrom(SPECIES_OPTIONS);
  const name = randomFrom(PET_NAMES);
  const breedOptions = BREEDS_BY_SPECIES[species] || ["Mixed Breed"];
  const breed = randomFrom(breedOptions.filter((b) => b !== "Other"));

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
  const [customBreed, setCustomBreed] = useState("");
  const [checkingShelter, setCheckingShelter] = useState(true);
  const [photoFiles, setPhotoFiles] = useState([]);

  useEffect(() => {
    async function checkShelter() {
      try {
        const profile = await getMyProfile();

        if (!profile.shelter) {
          navigate("/setup-shelter", { replace: true });
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
    setCustomBreed("");
    setPhotoFiles([]);
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);

    if (files.length > MAX_PHOTOS) {
      alert("Error: You can only upload up to 10 photos.");
      e.target.value = "";
      setPhotoFiles([]);
      return;
    }

    setPhotoFiles(files);
  }

  const breedOptions = BREEDS_BY_SPECIES[formData.species] || [];

  const filteredBreeds = breedOptions.filter((breed) =>
    breed.toLowerCase().includes(breedSearch.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const finalBreed = formData.breed === "Other" ? customBreed : formData.breed;

      const payload = new FormData();

      Object.entries({
        ...formData,
        breed: finalBreed
      }).forEach(([key, value]) => {
        payload.append(key, value);
      });

      photoFiles.forEach((file) => {
        payload.append("photos", file);
      });

      await createPet(payload);
      navigate("/profile");
    } catch (err) {
      alert(`Error creating pet: ${err.message}`);
    }
  }

  if (checkingShelter) {
    return (
      <div className="setup-container">
        <Text size="2" color="gray">
          Loading...
        </Text>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <Card size="4" className="setup-card">
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">
            Add a Pet
          </Heading>

          <Text size="2" color="gray" align="center">
            Please submit details about this pet to add to the shelter database.
          </Text>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Pet Name
                </Text>
                <TextField.Root
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Species
                </Text>

                <Select.Root
                  value={formData.species}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      species: value,
                      breed: ""
                    });
                    setBreedSearch("");
                    setCustomBreed("");
                  }}
                >
                  <Select.Trigger className="full-width" placeholder="Select species" />

                  <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                    {SPECIES_OPTIONS.map((species) => (
                      <Select.Item key={species} value={species}>
                        {species}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Breed
                </Text>

                <Select.Root
                  value={formData.breed}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      breed: value
                    })
                  }
                  disabled={!formData.species}
                >
                  <Select.Trigger className="full-width" placeholder="Select breed" />

                  <Select.Content className="app-dropdown breed-dropdown" position="popper" sideOffset={4}>
                    <div className="select-search-wrap">
                      <TextField.Root
                        value={breedSearch}
                        onChange={(e) => setBreedSearch(e.target.value)}
                        className="select-search"
                        placeholder="Search breeds..."
                      />
                    </div>

                    <Select.Separator />

                    {filteredBreeds.length > 0 ? (
                      filteredBreeds.map((breed) => (
                        <Select.Item key={breed} value={breed}>
                          {breed}
                        </Select.Item>
                      ))
                    ) : (
                      <div className="select-empty">No breeds found</div>
                    )}
                  </Select.Content>
                </Select.Root>
              </label>

              {formData.breed === "Other" && (
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Custom Breed
                  </Text>

                  <TextField.Root
                    value={customBreed}
                    onChange={(e) => setCustomBreed(e.target.value)}
                    placeholder="Enter breed"
                    required
                  />
                </label>
              )}

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Age
                </Text>

                <TextField.Root
                  name="age_years"
                  type="number"
                  value={formData.age_years}
                  onChange={handleChange}
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Sex
                </Text>

                <Select.Root
                  value={formData.sex}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      sex: value
                    })
                  }
                >
                  <Select.Trigger className="full-width" placeholder="Select sex" />

                  <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                    {SEX_OPTIONS.map((sex) => (
                      <Select.Item key={sex} value={sex}>
                        {sex}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Size
                </Text>

                <Select.Root
                  value={formData.size}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      size: value
                    })
                  }
                >
                  <Select.Trigger className="full-width" placeholder="Select size" />

                  <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                    {SIZE_OPTIONS.map((size) => (
                      <Select.Item key={size} value={size}>
                        {size}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Description
                </Text>

                <TextField.Root
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Photos
                </Text>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                />

                <Text size="1" color="gray" as="div">
                  Upload up to 10 photos.
                </Text>

                {photoFiles.length > 0 && (
                  <Text size="1" color="gray" as="div">
                    {photoFiles.length} photo(s) selected.
                  </Text>
                )}
              </label>

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