import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Flex, Heading, Select, Text, TextArea, TextField } from "@radix-ui/themes";
import { getPetById, updatePet, deletePet, uploadPetPhotos, deletePetPhoto } from "../services/pets.js";

const BREEDS_BY_SPECIES = {
  Dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog", "Bulldog", "Poodle", "Beagle", "Rottweiler", "Dachshund", "Corgi", "Australian Shepherd", "Yorkshire Terrier", "Boxer", "Great Dane", "Siberian Husky", "Doberman Pinscher", "Shih Tzu", "Boston Terrier", "Pomeranian", "Chihuahua", "Mixed Breed", "Other"],
  Cat: ["Persian", "Maine Coon", "Ragdoll", "British Shorthair", "Siamese", "American Shorthair", "Scottish Fold", "Sphynx", "Bengal", "Abyssinian", "Russian Blue", "Mixed Breed", "Other"],
  Bird: ["Parakeet", "Cockatiel", "Canary", "Lovebird", "Macaw", "Cockatoo", "African Grey Parrot", "Conure", "Finch", "Budgie", "Mixed Breed", "Other"],
  Rabbit: ["Holland Lop", "Netherland Dwarf", "Mini Rex", "Lionhead", "Flemish Giant", "Dutch Rabbit", "Mixed Breed", "Other"],
  "Guinea Pig": ["American Guinea Pig", "Abyssinian Guinea Pig", "Peruvian Guinea Pig", "Teddy Guinea Pig", "Skinny Pig", "Mixed Breed", "Other"],
  Hamster: ["Syrian Hamster", "Dwarf Hamster", "Roborovski Hamster", "Chinese Hamster", "Mixed Breed", "Other"],
  Other: ["Ferret", "Chinchilla", "Hedgehog", "Mouse", "Rat", "Gerbil", "Turtle", "Lizard", "Snake", "Mixed Breed", "Other"]
};

const SPECIES_OPTIONS = ["Dog", "Cat", "Bird", "Rabbit", "Guinea Pig", "Hamster", "Other"];
const SEX_OPTIONS = ["Male", "Female", "Unknown"];
const STATUS_OPTIONS = ["available", "pending", "adopted"];
const SIZE_OPTIONS = ["small", "medium", "large"];
const MAX_PHOTOS = 10;

function EditPet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pet, setPet] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [breedSearch, setBreedSearch] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    size: "small",
    status: "available",
    description: ""
  });

  useEffect(() => {
    async function loadPet() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getPetById(id);
        setPet(data);
        setFormData({
          name: data.name || "",
          species: data.species || "",
          breed: data.breed || "",
          age_years: data.age_years ?? "",
          sex: data.sex || "",
          size: data.size || "small",
          status: data.status || "available",
          description: data.description || ""
        });
      } catch (err) {
        console.error(err);
        setLoadError(err.message || "Could not load pet.");
      } finally {
        setLoading(false);
      }
    }
    loadPet();
  }, [id]);

  const breedOptions = BREEDS_BY_SPECIES[formData.species] || [];
  const filteredBreeds = breedOptions.filter((breed) => breed.toLowerCase().includes(breedSearch.toLowerCase()));

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  async function handleDeletePhoto() {
    const confirmed = window.confirm("Delete this photo?");
    if (!confirmed) return;
    try {
      await deletePetPhoto(id, pet.photos[photoIndex].id);
      const updatedPet = await getPetById(id);
      setPet(updatedPet);
      if (photoIndex >= updatedPet.photos.length) {
        setPhotoIndex(Math.max(updatedPet.photos.length - 1, 0));
      }
    } catch (err) {
      alert(err.message || "Could not delete photo.");
    }
  }

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    if ((pet?.photos?.length || 0) + files.length > MAX_PHOTOS) {
      alert("Error: You can only upload up to 10 photos.");
      e.target.value = "";
      return;
    }
    try {
      const payload = new FormData();
      files.forEach((file) => payload.append("photos", file));
      await uploadPetPhotos(id, payload);
      const updatedPet = await getPetById(id);
      setPet(updatedPet);
    } catch (err) {
      alert(err.message || "Could not upload photos.");
    }
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const finalBreed = formData.breed === "Other" ? customBreed : formData.breed;
      await updatePet(id, { ...formData, breed: finalBreed });
      navigate("/view-admin-pets");
    } catch (err) {
      alert(err.message || "Could not update pet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Are you sure you want to delete ${pet?.name || "this pet"}?`);
    if (!confirmed) return;
    try {
      await deletePet(id);
      navigate("/view-admin-pets");
    } catch (err) {
      alert(err.message || "Could not delete pet.");
    }
  }

  if (loading) {
    return (
      <div className="setup-container">
        <Text>Loading pet...</Text>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="setup-container">
        <Card size="3" className="setup-card">
          <Flex direction="column" gap="3">
            <Heading size="5">Could not load pet</Heading>
            <Text color="red">{loadError}</Text>
            <Button onClick={() => navigate("/view-admin-pets")}>Back to Manage Pets</Button>
          </Flex>
        </Card>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <Card size="4" className="setup-card">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Heading size="6" align="center">Edit Pet</Heading>

            <div className="edit-photo-slideshow">
              {pet?.photos?.length > 0 && (
                <div className="edit-photo-main">
                  <img src={pet.photos[photoIndex].url} alt={pet.name} className="edit-photo-main-image" />
                  <button type="button" className="delete-photo-btn" onClick={handleDeletePhoto}>
                    <span style={{ marginTop: "-2px" }}>×</span>
                  </button>
                </div>
              )}

              <Text size="1" color="gray">Upload up to 10 photos. ({pet?.photos?.length || 0}/10)</Text>

              <div className="edit-photo-thumbnails">
                {pet?.photos?.map((photo, index) => (
                  <button key={photo.id} type="button" className={index === photoIndex ? "edit-photo-thumb active" : "edit-photo-thumb"} onClick={() => setPhotoIndex(index)}>
                    <img src={photo.url} alt={`${pet.name} ${index + 1}`} />
                  </button>
                ))}

                {(pet?.photos?.length || 0) < MAX_PHOTOS && (
                  <label className="add-photo-thumb">
                    <input type="file" multiple accept="image/*" hidden onChange={handleAddPhotos} />
                    <span className="add-photo-plus">+</span>
                  </label>
                )}
              </div>
            </div>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Pet Name</Text>
              <TextField.Root name="name" value={formData.name} onChange={handleChange} required />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Species</Text>
              <Select.Root
                value={formData.species}
                onValueChange={(value) => {
                  setFormData({ ...formData, species: value, breed: "" });
                  setBreedSearch("");
                  setCustomBreed("");
                }}
              >
                <Select.Trigger className="full-width" placeholder="Select species" />
                <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                  {SPECIES_OPTIONS.map((species) => (
                    <Select.Item key={species} value={species}>{species}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Breed</Text>
              <Select.Root
                value={formData.breed}
                onValueChange={(value) => setFormData({ ...formData, breed: value })}
                disabled={!formData.species}
              >
                <Select.Trigger className="full-width" placeholder="Select breed" />
                <Select.Content className="app-dropdown breed-dropdown" position="popper" sideOffset={4}>
                  <div className="select-search-wrap">
                    <TextField.Root value={breedSearch} onChange={(e) => setBreedSearch(e.target.value)} className="select-search" placeholder="Search breeds..." />
                  </div>
                  <Select.Separator />
                  {filteredBreeds.length > 0 ? (
                    filteredBreeds.map((breed) => (
                      <Select.Item key={breed} value={breed}>{breed}</Select.Item>
                    ))
                  ) : (
                    <div className="select-empty">No breeds found</div>
                  )}
                </Select.Content>
              </Select.Root>
            </label>

            {formData.breed === "Other" && (
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Custom Breed</Text>
                <TextField.Root value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} placeholder="Enter breed" required />
              </label>
            )}

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Age</Text>
              <TextField.Root name="age_years" type="number" value={formData.age_years} onChange={handleChange} />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Sex</Text>
              <Select.Root value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                <Select.Trigger className="full-width" placeholder="Select sex" />
                <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                  {SEX_OPTIONS.map((sex) => (
                    <Select.Item key={sex} value={sex}>{sex}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Size</Text>
              <Select.Root value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                <Select.Trigger className="full-width" placeholder="Select size" />
                <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                  {SIZE_OPTIONS.map((size) => (
                    <Select.Item key={size} value={size}>{size}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Status</Text>
              <Select.Root value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <Select.Trigger className="full-width" />
                <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                  {STATUS_OPTIONS.map((status) => (
                    <Select.Item key={status} value={status}>{status}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Description</Text>
              <TextArea name="description" value={formData.description} onChange={handleChange} rows={4} />
            </label>

            <Flex gap="3">
              <Button type="submit" disabled={saving} className="flex-grow">{saving ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" color="red" variant="soft" onClick={handleDelete}>Delete Pet</Button>
            </Flex>

            <Button type="button" variant="soft" onClick={() => navigate("/view-admin-pets")}>Cancel</Button>
          </Flex>
        </form>
      </Card>
    </div>
  );
}

export default EditPet;