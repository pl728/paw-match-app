import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, TextField, Select, Button, Box } from "@radix-ui/themes";
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
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_PHOTO_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

function emptyPhotoSlots() {
  return Array.from({ length: MAX_PHOTOS }, () => null);
}

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
  const [currentStep, setCurrentStep] = useState(1);
  const [photoFiles, setPhotoFiles] = useState(emptyPhotoSlots);
  const [detailsError, setDetailsError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const photoPreviews = useMemo(
    () => photoFiles.map((file) => (file ? URL.createObjectURL(file) : null)),
    [photoFiles]
  );
  const photoCount = photoFiles.filter(Boolean).length;

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [photoPreviews]);

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
    setDetailsError("");
  }

  function handleFillRandom() {
    setFormData(buildRandomPetForm());
    setBreedSearch("");
    setPhotoFiles(emptyPhotoSlots());
    setCurrentStep(1);
    setDetailsError("");
    setPhotoError("");
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

  function handleDetailsSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setDetailsError("Pet name is required.");
      return;
    }

    setDetailsError("");
    setCurrentStep(2);
  }

  function handlePhotoSelect(index, e) {
    const file = e.target.files?.[0] || null;
    e.target.value = "";

    if (!file) {
      return;
    }

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Each image must be 5 MB or smaller.");
      return;
    }

    setPhotoFiles((currentFiles) =>
      currentFiles.map((currentFile, currentIndex) =>
        currentIndex === index ? file : currentFile
      )
    );
    setPhotoError("");
  }

  function handleRemovePhoto(index) {
    setPhotoFiles((currentFiles) =>
      currentFiles.map((currentFile, currentIndex) =>
        currentIndex === index ? null : currentFile
      )
    );
    setPhotoError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      setCurrentStep(1);
      setDetailsError("Pet name is required.");
      return;
    }

    if (photoCount < MIN_PHOTOS) {
      setCurrentStep(2);
      setPhotoError(`Add at least ${MIN_PHOTOS} photos before creating this pet.`);
      return;
    }

    setSubmitting(true);

    try {
      const finalBreed = formData.breed === "Other" ? customBreed : formData.breed;

      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        payload.append(k, k === "name" ? v.trim() : v);
      });

      photoFiles.filter(Boolean).forEach((file) => {
        payload.append("photos", file);
      });

      await createPet(payload);
      navigate("/profile");
    } catch (err) {
      alert(`Error creating pet: ${err.message}`);
    } finally {
      setSubmitting(false);
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

          <div className="pet-create-stepper" aria-label="Create pet steps">
            <span className={currentStep === 1 ? "active" : ""}>1. Details</span>
            <span className={currentStep === 2 ? "active" : ""}>2. Photos</span>
          </div>

          <form onSubmit={currentStep === 1 ? handleDetailsSubmit : handleSubmit}>
            {currentStep === 1 && (
              <Flex direction="column" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Pet Name</Text>
                  <TextField.Root name="name" value={formData.name} onChange={handleChange} required />
                </label>

                <label>
                  <Text as="div" size="2" mb="1" weight="bold">Species</Text>
                  <Select.Root
                    value={formData.species}
                    onValueChange={(v) => {
                      setFormData({ ...formData, species: v });
                      setDetailsError("");
                    }}
                  >
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
                  <Select.Root
                    value={formData.breed}
                    onValueChange={(v) => {
                      setFormData({ ...formData, breed: v });
                      setDetailsError("");
                    }}
                  >
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
                  <Select.Root
                    value={formData.sex}
                    onValueChange={(v) => {
                      setFormData({ ...formData, sex: v });
                      setDetailsError("");
                    }}
                  >
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
                  <Select.Root
                    value={formData.size}
                    onValueChange={(v) => {
                      setFormData({ ...formData, size: v });
                      setDetailsError("");
                    }}
                  >
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

                {detailsError && <Text size="2" color="red">{detailsError}</Text>}

                <Flex gap="3" mt="3">
                  <Button type="button" variant="soft" onClick={handleFillRandom}>
                    Fill random
                  </Button>
                  <Button type="submit" className="flex-grow">
                    Continue
                  </Button>
                </Flex>
              </Flex>
            )}

            {currentStep === 2 && (
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center" gap="3" wrap="wrap">
                  <Box>
                    <Text as="div" size="2" weight="bold">Pet Photos</Text>
                    <Text size="2" color={photoCount >= MIN_PHOTOS ? "green" : "gray"}>
                      {photoCount} of {MAX_PHOTOS} selected
                    </Text>
                  </Box>
                  <Text size="2" color="gray">
                    Minimum {MIN_PHOTOS}
                  </Text>
                </Flex>

                <div className="pet-photo-upload-grid">
                  {photoFiles.map((file, index) => {
                    const inputId = `pet-photo-${index}`;
                    const previewUrl = photoPreviews[index];

                    return (
                      <div
                        key={inputId}
                        className={`pet-photo-upload-slot ${file ? "has-photo" : ""}`}
                      >
                        <input
                          id={inputId}
                          className="pet-photo-file-input"
                          type="file"
                          accept={ACCEPTED_PHOTO_EXTENSIONS}
                          onChange={(e) => handlePhotoSelect(index, e)}
                        />

                        {previewUrl ? (
                          <>
                            <img src={previewUrl} alt={`Pet preview ${index + 1}`} />
                            <div className="pet-photo-slot-actions">
                              <label htmlFor={inputId}>Replace</label>
                              <button type="button" onClick={() => handleRemovePhoto(index)}>
                                Remove
                              </button>
                            </div>
                          </>
                        ) : (
                          <label htmlFor={inputId} className="pet-photo-empty-slot">
                            <span>Photo {index + 1}</span>
                            <strong>Add image</strong>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {photoError && <Text size="2" color="red">{photoError}</Text>}

                <Flex gap="3" mt="3">
                  <Button type="button" variant="soft" onClick={() => setCurrentStep(1)} disabled={submitting}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-grow" disabled={photoCount < MIN_PHOTOS || submitting}>
                    {submitting ? "Creating..." : "Create Pet"}
                  </Button>
                </Flex>
              </Flex>
            )}
          </form>
        </Flex>
      </Card>
    </div>
  );
}

export default CreatePet;
