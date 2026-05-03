import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";
import { getFavorites, addFavorite, removeFavorite } from "../services/favorites.js";

const PAGE_SIZE = 25;

export default function BrowseAllPets() {
  const [pets, setPets] = useState([]);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritePetIds, setFavoritePetIds] = useState([]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showPagination = !loading && !error && total > 0;

  useEffect(() => {
    let active = true;

    async function fetchPets() {
      try {
        setLoading(true);
        setError(null);
        const result = await getPets({ page, limit: PAGE_SIZE });

        if (!active) return;

        setPets(Array.isArray(result?.data) ? result.data : []);
        setTotal(Number(result?.total) || 0);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load pets.");
        setPets([]);
        setTotal(0);
      }

      if (active) setLoading(false);
    }

    fetchPets();
    return () => { active = false; };
  }, [page]);

  useEffect(() => {
    let active = true;

    async function fetchFavorites() {
      try {
        const result = await getFavorites();

        if (!active) return;

        const ids = Array.isArray(result)
          ? result.map(f => Number(f.pet_id))
          : [];

        setFavoritePetIds(ids);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }

    fetchFavorites();
    return () => { active = false; };
  }, []);

  async function handleToggleFavorite(petId) {
    try {
      if (favoritePetIds.includes(petId)) {
        await removeFavorite(petId);
        setFavoritePetIds(prev => prev.filter(id => id !== petId));
      } else {
        await addFavorite(petId);
        setFavoritePetIds(prev => [...prev, petId]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Heading size="7">Browse All Pets</Heading>

        <Card size="2">
          <Flex direction={{ initial: "column", sm: "row" }} gap="3" justify="between" align="center">

            <Flex gap="2" wrap="wrap" align="center">
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

            <Flex gap="3" wrap="wrap" align="center">
              <Text size="2" color="gray">{total} pets total</Text>

              <Flex gap="2" align="center">
                <Button
                  variant="soft"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>

                <Text size="2" weight="medium">
                  Page {page} of {totalPages}
                </Text>

                <Button
                  variant="soft"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {loading && <Text size="2" color="gray">Loading pets…</Text>}
        {error && <Text size="2" color="red">{error}</Text>}

        {!loading && !error && pets.length === 0 && (
          <Text size="2" color="gray">No pets found.</Text>
        )}

        {!loading && !error && pets.length > 0 && (
          <>
            {view === "grid" && (
              <div className="pets-grid">
                {pets.map((pet) => (
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
                        {["Name", "Species", "Breed", "Age", "Sex", "Size", "Status", "Favorite", ""]
                          .map(h => <th key={h} className="pets-th">{h}</th>)}
                      </tr>
                    </thead>

                    <tbody>
                      {pets.map((pet) => (
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

        {showPagination && (
          <Flex justify="center" align="center" gap="4">
            <Button size="3" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Prev
            </Button>

            <Text size="3" weight="bold">
              Page {page} of {totalPages}
            </Text>

            <Button size="3" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </Flex>
        )}
      </Flex>
    </div>
  );
}