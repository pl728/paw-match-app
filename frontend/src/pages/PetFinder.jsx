import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";
import photo from "../assets/photo-coming-soon.png";

function PetFinder() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-select state
  const [species, setSpecies] = useState([]);
  const [breed, setBreed] = useState([]);
  const [sex, setSex] = useState([]);
  const [ageRange, setAgeRange] = useState([]);
  const [size, setSize] = useState([]);

  const [results, setResults] = useState([]);

  useEffect(() => {
    let isActive = true;
    async function fetchPets() {
      try {
        const data = await getPets();
        if (isActive) setPets(data);
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }
    fetchPets();
    return () => { isActive = false; };
  }, []);

  // Toggle selection helper
  const toggleOption = (state, setState, option) => {
    if (state.includes(option)) {
      setState(state.filter(o => o !== option));
    } else {
      setState([...state, option]);
    }
  };

  const handleSubmit = () => {
    const filtered = pets.filter(pet => {
      if (species.length && !species.includes(pet.species)) return false;
      if ((pet.species === "Dog" || pet.species === "Cat") && breed.length && !breed.includes(pet.breed)) return false;
      if (sex.length && !sex.includes(pet.sex)) return false;

      const age = pet.age_years || 0;
      if (ageRange.length) {
        if (ageRange.includes("puppy") && age > 2) return false;
        if (ageRange.includes("middle") && (age < 2 || age > 7)) return false;
        if (ageRange.includes("senior") && age < 7) return false;
      }

      if (size.length && !size.includes(pet.size)) return false;

      return true;
    });

    setResults(filtered);
  };

  // Options
  const speciesOptions = ["Dog", "Cat", "Rabbit", "Other"];
  const allBreedOptions = {
    Dog: ["Labrador", "Golden Retriever", "Other"],
    Cat: ["Siamese", "Persian", "Other"]
  };
  const sexOptions = ["Male", "Female"];
  const ageOptions = ["Young", "Middle-Aged", "Senior-Citizen"];
  const sizeOptions = ["XS", "Small", "Medium", "Large", "XL"];

  // Breed options dynamically based on selected species
  const breedOptions = species.flatMap(s => allBreedOptions[s] || []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 20px" }}>
      <Heading size="6" mb="6">Find My Furrever Pet</Heading>

      <Card size="3" variant="ghost" mb="6">
        <Flex direction="column" gap="4">
          {/* Species Question */}
          <Text weight="bold">Which pet species are you interested in?</Text>
          <Flex gap="2" wrap="wrap">
            {speciesOptions.map(opt => (
              <Button
                key={opt}
                variant={species.includes(opt) ? "primary" : "outline"}
                onClick={() => toggleOption(species, setSpecies, opt)}
              >
                {opt}
              </Button>
            ))}
          </Flex>

          {/* Breed Question (specific to chosen species) */}
          {breedOptions.length > 0 && (
            <>
              <Text weight="bold">Which breed are you interested in?</Text>
              <Flex gap="2" wrap="wrap">
                {breedOptions.map(opt => (
                  <Button
                    key={opt}
                    variant={breed.includes(opt) ? "primary" : "outline"}
                    onClick={() => toggleOption(breed, setBreed, opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </Flex>
            </>
          )}

          {/* Sex Question */}
          <Text weight="bold">Do you prefer a boy pet, girl pet, or any?</Text>
          <Flex gap="2" wrap="wrap">
            {["Male", "Female", "Any"].map(opt => (
              <Button
                key={opt}
                variant={sex.includes(opt.toLowerCase()) ? "primary" : "outline"}
                onClick={() => toggleOption(sex, setSex, opt.toLowerCase())}
              >
                {opt}
              </Button>
            ))}
          </Flex>

          {/* Age Range Question */}
          <Text weight="bold">Which age range are you looking for?</Text>
          <Flex gap="2" wrap="wrap">
            {ageOptions.map(opt => (
              <Button
                key={opt}
                variant={ageRange.includes(opt) ? "primary" : "outline"}
                onClick={() => toggleOption(ageRange, setAgeRange, opt)}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Button>
            ))}
          </Flex>

          {/* Size Question */}
          <Text weight="bold">What size pet are you looking for?</Text>
          <Flex gap="2" wrap="wrap">
            {sizeOptions.map(opt => (
              <Button
                key={opt}
                variant={size.includes(opt.toLowerCase()) ? "primary" : "outline"}
                onClick={() => toggleOption(size, setSize, opt.toLowerCase())}
              >
                {opt}
              </Button>
            ))}
          </Flex>

          <Button size="3" onClick={handleSubmit} style={{ marginTop: "16px" }}>
            Find Pets
          </Button>
        </Flex>
      </Card>

      {/* Results */}
      {loading && <Text size="2" color="gray">Loading pets…</Text>}
      {error && <Text size="2" color="red">{error}</Text>}

      {results.length > 0 && (
        <Flex direction="column" gap="3">
          {results.map(pet => (
            <Card key={pet.id} size="2">
              <Flex gap="2" align="center">
                <img
                  src={pet.primary_photo_url || photo}
                  alt={pet.name}
                  width={"150px"}
                  height={"150px"}
                  style={{ borderRadius: "8px", objectFit: "cover" }}
                />
                <Flex direction="column">
                  <Text weight="bold">{pet.name}</Text>
                  <Text size="2" color="white">{pet.species} • {pet.breed || "Unknown"} • {pet.age_years || "Unknown"} yrs</Text>
                  <Text size="2" color="white">Gender: {pet.sex || "Unknown"}</Text>
                  <Text size="2" color="white">Size: {pet.size || "Unknown"}</Text>
                  <Text size="2" color="white">{pet.shelter_name}</Text>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {!loading && results.length === 0 && (
        <Text size="2" color="gray">No pets match your preferences yet.</Text>
      )}
    </div>
  );
}

export default PetFinder;