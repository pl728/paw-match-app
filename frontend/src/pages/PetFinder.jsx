import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";
import photo from "../assets/photo-coming-soon.png";

function PetFinder() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const result = await getPets();
        if (isActive) setPets(result.data);
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }
    fetchPets();
    return () => { isActive = false; };
  }, []);

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
      if (sex.length && !sex.includes(pet.sex?.toLowerCase())) return false;

      const age = pet.age_years || 0;
      if (ageRange.length) {
        const matchesAge =
          (ageRange.includes("Young") && age <= 2) ||
          (ageRange.includes("Middle-Aged") && age >= 3 && age <= 7) ||
          (ageRange.includes("Senior-Citizen") && age > 7);

        if (!matchesAge) return false;
      }

      if (size.length && !size.includes(pet.size)) return false;

      return true;
    });

    setResults(filtered);
  };

  const speciesOptions = ["Dog", "Cat", "Rabbit", "Other"];
  const allBreedOptions = {
    Dog: ["Labrador", "Golden Retriever", "Other"],
    Cat: ["Siamese", "Persian", "Other"]
  };
  const ageOptions = ["Young", "Middle-Aged", "Senior-Citizen"];
  const sizeOptions = ["XS", "Small", "Medium", "Large", "XL"];

  const breedOptions = species.flatMap(s => allBreedOptions[s] || []);

  return (
    <div className="page">
      <Heading size="6" mb="6">Find My Furrever Pet</Heading>

      <Card size="3" variant="ghost" mb="6">
        <Flex direction="column" gap="4">
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

          <Text weight="bold">Which age range are you looking for?</Text>
          <Flex gap="2" wrap="wrap">
            {ageOptions.map(opt => (
              <Button
                key={opt}
                variant={ageRange.includes(opt) ? "primary" : "outline"}
                onClick={() => toggleOption(ageRange, setAgeRange, opt)}
              >
                {opt}
              </Button>
            ))}
          </Flex>

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

          <Button size="3" onClick={handleSubmit} className="mt-16">
            Find Pets
          </Button>
        </Flex>
      </Card>

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
                  className="pet-result-image"
                />
                <Flex direction="column">
                  <Text weight="bold">{pet.name}</Text>
                  <Text size="2" className="theme-text">
                    {pet.species} • {pet.breed || "Unknown"} • {pet.age_years || "Unknown"} yrs
                  </Text>
                  <Text size="2" className="theme-muted">
                    Gender: {pet.sex || "Unknown"}
                  </Text>
                  <Text size="2" className="theme-muted">
                    Size: {pet.size || "Unknown"}
                  </Text>
                  <Text size="2" className="theme-muted">
                    {pet.shelter_name}
                  </Text>
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