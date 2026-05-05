import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getFavorites, removeFavorite } from "../services/favorites.js";
import { getPets } from "../services/pets.js";

export default function Favorites() {
  const [favoritePets, setFavoritePets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchFavoritePets() {
      try {
        setLoading(true);
        setError(null);

        const favoritesResult = await getFavorites();
        const favoriteIds = Array.isArray(favoritesResult)
          ? favoritesResult.map((f) => f.pet_id)
          : [];

        const petsResult = await getPets({ page: 1, limit: 1000 });
        const allPets = Array.isArray(petsResult?.data) ? petsResult.data : [];

        const filteredPets = allPets.filter((pet) => favoriteIds.includes(pet.id));

        if (!active) return;
        setFavoritePets(filteredPets);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load favorites.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchFavoritePets();

    return () => {
      active = false;
    };
  }, []);

  async function handleRemoveFavorite(petId) {
    try {
      await removeFavorite(petId);
      setFavoritePets((prev) => prev.filter((pet) => pet.id !== petId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  }

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Heading size="7">My Favorites</Heading>

        {loading && <Text size="2" color="gray">Loading favorites...</Text>}
        {error && <Text size="2" color="red">{error}</Text>}

        {!loading && !error && favoritePets.length === 0 && (
          <Text size="2" color="gray">You have no favorite pets yet.</Text>
        )}

        {!loading && !error && favoritePets.length > 0 && (
          <div className="pets-grid">
            {favoritePets.map((pet) => (
              <Card key={pet.id} size="2">
                <Flex direction="column" gap="2">
                  {pet.primary_photo_url && (
                    <img
                      src={pet.primary_photo_url}
                      alt={pet.name}
                      className="favorite-pet-image"
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

                  <Flex gap="2" direction="column" align="start">
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      onClick={() => handleRemoveFavorite(pet.id)}
                    >
                      Unfavorite
                    </Button>

                    <Link to={`/pets/${pet.id}`}>View full details</Link>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </div>
        )}
      </Flex>
    </div>
  );
}