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

function CreatePet() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    size: "small"
  });

  const [breedSearch, setBreedSearch] = useState("");
  const [checkingShelter, setCheckingShelter] = useState(true);

  useEffect(() => {
    async function checkShelter() {
      try {
        const profile = await getMyProfile();
        if (!profile.shelter) {
          navigate('/setup-shelter', { replace: true });
        }
      } catch (err) {
        console.error('Error checking shelter:', err);
      } finally {
        setCheckingShelter(false);
      }
    }
    checkShelter();
  }, [navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  }

  const filteredBreeds = BREEDS.filter(breed =>
    breed.toLowerCase().includes(breedSearch.toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await createPet(formData);
      navigate('/view-pets');
    } catch (err) {
      alert(`Error creating pet: ${err.message}`);
    }
  }

  if (checkingShelter) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 73px)',
        padding: '40px 20px'
      }}>
        <Text size="2" color="gray">Loading...</Text>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 73px)',
      padding: '40px 20px'
    }}>
      <Card size="4" style={{ width: '100%', maxWidth: '500px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Add a Pet</Heading>
          <Text size="2" color="gray" align="center">
            Please submit details about this pet to add to the shelter database.
          </Text>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Pet Name</Text>
                <TextField.Root
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter pet name"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Species</Text>
                <Select.Root
                  value={formData.species}
                  onValueChange={(value) => setFormData({...formData, species: value})}
                  required
                >
                  <Select.Trigger placeholder="Select species" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="Dog">Dog</Select.Item>
                    <Select.Item value="Cat">Cat</Select.Item>
                    <Select.Item value="Bird">Bird</Select.Item>
                    <Select.Item value="Rabbit">Rabbit</Select.Item>
                    <Select.Item value="Guinea Pig">Guinea Pig</Select.Item>
                    <Select.Item value="Hamster">Hamster</Select.Item>
                    <Select.Item value="Other">Other</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Breed</Text>
                <Select.Root
                  value={formData.breed}
                  onValueChange={(value) => setFormData({...formData, breed: value})}
                  required
                >
                  <Select.Trigger placeholder="Select or search breed" style={{ width: '100%' }} />
                  <Select.Content>
                    <TextField.Root
                      placeholder="Search breeds..."
                      value={breedSearch}
                      onChange={(e) => setBreedSearch(e.target.value)}
                      style={{ margin: '8px' }}
                    />
                    <Select.Separator />
                    {filteredBreeds.length > 0 ? (
                      filteredBreeds.map(breed => (
                        <Select.Item key={breed} value={breed}>{breed}</Select.Item>
                      ))
                    ) : (
                      <Text size="2" color="gray" style={{ padding: '8px' }}>No breeds found</Text>
                    )}
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Age (years)</Text>
                <TextField.Root
                  name="age_years"
                  type="number"
                  value={formData.age_years}
                  onChange={handleChange}
                  placeholder="Age in years"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Sex</Text>
                <Select.Root
                  value={formData.sex}
                  onValueChange={(value) => setFormData({...formData, sex: value})}
                  required
                >
                  <Select.Trigger placeholder="Select sex" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="Male">Male</Select.Item>
                    <Select.Item value="Female">Female</Select.Item>
                    <Select.Item value="Unknown">Unknown</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Size</Text>
                <Select.Root name="size" value={formData.size} onValueChange={(value) => setFormData({...formData, size: value})}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="small">Small</Select.Item>
                    <Select.Item value="medium">Medium</Select.Item>
                    <Select.Item value="large">Large</Select.Item>
                  </Select.Content>
                </Select.Root>
              </label>

              <Button type="submit" size="3" style={{ marginTop: '12px' }}>
                Create Pet
              </Button>
            </Flex>
          </form>
        </Flex>
      </Card>
    </div>
  );
}

export default CreatePet;
