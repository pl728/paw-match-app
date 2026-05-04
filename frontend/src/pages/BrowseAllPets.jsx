import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";
import { getFavorites, addFavorite, removeFavorite } from "../services/favorites.js";

const PAGE_SIZE = 60;

export default function BrowseAllPets() {
  const [allPets, setAllPets] = useState([]);
  const [pets, setPets] = useState([]);
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoritePetIds, setFavoritePetIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [species, setSpecies] = useState([]);
  const [breed, setBreed] = useState([]);
  const [sex, setSex] = useState([]);
  const [ageRange, setAgeRange] = useState([]);
  const [size, setSize] = useState([]);

  const total = pets.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedPets = pets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    async function fetchPets() {
      try {
        setLoading(true);
        const result = await getPets();
        const petData = Array.isArray(result?.data) ? result.data : [];
        setAllPets(petData);
        setPets(petData);
      } catch (err) {
        setError(err?.message || "Failed to load pets.");
      } finally {
        setLoading(false);
      }
    }

    fetchPets();
  }, []);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const result = await getFavorites();
        const ids = Array.isArray(result)
          ? result.map((f) => Number(f.pet_id))
          : [];

        setFavoritePetIds(ids);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }

    fetchFavorites();
  }, []);

  const toggleOption = (state, setState, option) => {
    if (state.includes(option)) {
      setState(state.filter((item) => item !== option));
    } else {
      setState([...state, option]);
    }
  };

  const applyFilters = (searchValue = searchTerm) => {
  const filtered = allPets.filter((pet) => {
    const search = searchValue.toLowerCase();

    const matchesSearch =
      !search ||
      pet.name?.toLowerCase().includes(search) ||
      pet.breed?.toLowerCase().includes(search) ||
      pet.species?.toLowerCase().includes(search);

    if (!matchesSearch) return false;

    if (species.length && !species.includes(pet.species)) return false;
    if (breed.length && !breed.includes(pet.breed)) return false;

    if (
      sex.length &&
      !sex.includes("any") &&
      !sex.includes(pet.sex?.toLowerCase())
    ) {
      return false;
    }

    const age = Number(pet.age_years) || 0;

    if (ageRange.length) {
      const matchesAge =
        (ageRange.includes("Young") && age <= 2) ||
        (ageRange.includes("Middle-Aged") && age >= 3 && age <= 7) ||
        (ageRange.includes("Senior-Citizen") && age > 7);

      if (!matchesAge) return false;
    }

    if (size.length && !size.includes(pet.size?.toLowerCase())) return false;

    return true;
  });

  setPets(filtered);
  setPage(1);
};

  const clearSearch = () => {
    setSearchTerm("");
    setSpecies([]);
    setBreed([]);
    setSex([]);
    setAgeRange([]);
    setSize([]);
    setPets(allPets);
    setPage(1);
  };

  async function handleToggleFavorite(petId) {
    try {
      if (favoritePetIds.includes(petId)) {
        await removeFavorite(petId);
        setFavoritePetIds((prev) => prev.filter((id) => id !== petId));
      } else {
        await addFavorite(petId);
        setFavoritePetIds((prev) => [...prev, petId]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  const speciesOptions = ["Dog", "Cat", "Rabbit", "Other"];

  const allBreedOptions = {
    Dog: ["Labrador", "Golden Retriever", "Other"],
    Cat: ["Siamese", "Persian", "Other"],
  };

  const breedOptions = species.flatMap((s) => allBreedOptions[s] || []);
  const ageOptions = ["Young", "Middle-Aged", "Senior-Citizen"];
  const sizeOptions = ["XS", "Small", "Medium", "Large", "XL"];

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Heading size="7">Browse Pets</Heading>

        <Card size="2">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center" gap="3">
              <input
                type="text"
                placeholder="Search pets..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  applyFilters(e.target.value);
                }}
              />

              <Button
                variant="soft"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? "Hide Filters" : "Filter"}
              </Button>
            </Flex>

            {showFilters && (
              <Flex direction="column" gap="4">
                <Text weight="bold">Species</Text>
                <Flex gap="2" wrap="wrap">
                  {speciesOptions.map((opt) => (
                    <Button
                      key={opt}
                      variant={species.includes(opt) ? "solid" : "soft"}
                      onClick={() => toggleOption(species, setSpecies, opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </Flex>

                {breedOptions.length > 0 && (
                  <>
                    <Text weight="bold">Breed</Text>
                    <Flex gap="2" wrap="wrap">
                      {breedOptions.map((opt) => (
                        <Button
                          key={opt}
                          variant={breed.includes(opt) ? "solid" : "soft"}
                          onClick={() => toggleOption(breed, setBreed, opt)}
                        >
                          {opt}
                        </Button>
                      ))}
                    </Flex>
                  </>
                )}

                <Text weight="bold">Sex</Text>
                <Flex gap="2" wrap="wrap">
                  {["Male", "Female", "Any"].map((opt) => (
                    <Button
                      key={opt}
                      variant={sex.includes(opt.toLowerCase()) ? "solid" : "soft"}
                      onClick={() => toggleOption(sex, setSex, opt.toLowerCase())}
                    >
                      {opt}
                    </Button>
                  ))}
                </Flex>

                <Text weight="bold">Age Range</Text>
                <Flex gap="2" wrap="wrap">
                  {ageOptions.map((opt) => (
                    <Button
                      key={opt}
                      variant={ageRange.includes(opt) ? "solid" : "soft"}
                      onClick={() => toggleOption(ageRange, setAgeRange, opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </Flex>

                <Text weight="bold">Size</Text>
                <Flex gap="2" wrap="wrap">
                  {sizeOptions.map((opt) => (
                    <Button
                      key={opt}
                      variant={size.includes(opt.toLowerCase()) ? "solid" : "soft"}
                      onClick={() => toggleOption(size, setSize, opt.toLowerCase())}
                    >
                      {opt}
                    </Button>
                  ))}
                </Flex>

                <Flex gap="2">
                  <Button onClick={() => applyFilters()}>Apply Filters</Button>
                  <Button variant="soft" onClick={clearSearch}>
                    Clear
                  </Button>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Card>

        <Card size="2">
          <Flex justify="between" align="center">
            <Flex gap="2" align="center">
              <Text size="2" color="gray">View:</Text>

              <Button
                variant={view === "grid" ? "solid" : "soft"}
                onClick={() => setView("grid")}
              >
                Grid
              </Button>

              <Button
                variant={view === "table" ? "solid" : "soft"}
                onClick={() => setView("table")}
              >
                Table
              </Button>
            </Flex>

            <Text size="2" color="gray">
              {total} pets found
            </Text>
          </Flex>
        </Card>

        {loading && <Text size="2" color="gray">Loading pets…</Text>}
        {error && <Text size="2" color="red">{error}</Text>}

        {!loading && !error && pets.length === 0 && (
          <Text size="2" color="gray">No pets match your search.</Text>
        )}

        {!loading && !error && pagedPets.length > 0 && (
          <>
            {view === "grid" && (
              <div className="pets-grid">
                {pagedPets.map((pet) => (
                  <Card key={pet.id} size="2">
                    <Flex direction="column" gap="2">
                      {pet.primary_photo_url && (
                        <img
                          src={pet.primary_photo_url}
                          alt={pet.name}
                          className="pet-card-image"
                          loading="lazy"
                        />
                      )}

                      <Heading size="4">{pet.name}</Heading>

                      <Text size="2" color="gray">
                        {pet.species || "Unknown"} • {pet.breed || "Unknown breed"}
                      </Text>

                      <Text size="2" color="gray">
                        Age: {pet.age_years ?? "?"} • Size: {pet.size || "?"}
                      </Text>

                      <Button
                        size="1"
                        variant={favoritePetIds.includes(pet.id) ? "solid" : "soft"}
                        onClick={() => handleToggleFavorite(pet.id)}
                      >
                        {favoritePetIds.includes(pet.id) ? "Unfavorite" : "Favorite"}
                      </Button>

                      <Link to={`/pets/${pet.id}`}>View full details</Link>
                    </Flex>
                  </Card>
                ))}
              </div>
            )}

            {view === "table" && (
              <Card size="2">
                <div className="table-container">
                  <table className="pets-table">
                    <thead>
                      <tr>
                        {["Name", "Species", "Breed", "Age", "Sex", "Size", "Status", "Favorite", ""].map((h) => (
                          <th key={h} className="pets-th">{h}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {pagedPets.map((pet) => (
                        <tr key={pet.id}>
                          <td className="pets-td">{pet.name}</td>
                          <td className="pets-td">{pet.species || "—"}</td>
                          <td className="pets-td">{pet.breed || "—"}</td>
                          <td className="pets-td">{pet.age_years ?? "—"}</td>
                          <td className="pets-td">{pet.sex || "—"}</td>
                          <td className="pets-td">{pet.size || "—"}</td>
                          <td className="pets-td">{pet.status || "—"}</td>
                          <td className="pets-td">
                            <Button
                              size="1"
                              variant={favoritePetIds.includes(pet.id) ? "solid" : "soft"}
                              onClick={() => handleToggleFavorite(pet.id)}
                            >
                              {favoritePetIds.includes(pet.id) ? "Saved" : "Save"}
                            </Button>
                          </td>
                          <td className="pets-td">
                            <Link to={`/pets/${pet.id}`}>View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {!loading && !error && total > 0 && (
          <Flex direction="column" justify="center" align="center" gap="2">
            <Text size="2" color="gray">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </Text>

            <Flex justify="center" align="center" gap="4">
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>

              <Text size="3" weight="bold">
                Page {page} of {totalPages}
              </Text>

              <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </div>
  );
}