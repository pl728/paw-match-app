import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { getPets, getPetById } from "../services/pets.js";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function BrowseAllPets() {
  const [pets, setPets] = useState([]);
  const [view, setView] = useState("grid");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [photoByPetId, setPhotoByPetId] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchPets() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPets();
        if (!active) return;

        setPets(Array.isArray(data) ? data : []);
        setPage(1);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load pets.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    fetchPets();
    return () => {
      active = false;
    };
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(pets.length / pageSize));
  }, [pets.length, pageSize]);

  const pagedPets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return pets.slice(start, start + pageSize);
  }, [pets, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    let active = true;

    async function loadPhotosForPage() {
      const ids = pagedPets.map((p) => p.id);

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const fullPet = await getPetById(id); 
            const url = fullPet?.photos?.[0]?.url || null;
            return [id, url];
          } catch {
            return [id, null];
          }
        })
      );

      if (!active) return;

      setPhotoByPetId((prev) => {
        const next = { ...prev };
        for (const [id, url] of results) next[id] = url;
        return next;
      });
    }

    if (view === "grid" && pagedPets.length > 0) {
      loadPhotosForPage();
    }

    return () => {
      active = false;
    };
  }, [view, pagedPets]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px" }}>
      <Flex direction="column" gap="4">
        <Heading size="7">Browse All Pets</Heading>

        <Card size="2">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            justify="between"
            align="center"
          >
            <Flex gap="2" wrap="wrap" align="center">
              <Text size="2" color="gray">
                View:
              </Text>
              <Button
                variant={view === "grid" ? "solid" : "soft"}
                onClick={() => setView("grid")}
              >
                Grid
              </Button>
              <Button
                variant={view === "details" ? "solid" : "soft"}
                onClick={() => setView("details")}
              >
                Details
              </Button>
              <Button
                variant={view === "table" ? "solid" : "soft"}
                onClick={() => setView("table")}
              >
                Table
              </Button>
            </Flex>

            <Flex gap="3" wrap="wrap" align="center" justify="end">
              <Text size="2" color="gray">
                Per page:
              </Text>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <Flex gap="2" align="center">
                <Button
                  variant="soft"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Text size="2">
                  Page {page} / {totalPages}
                </Text>
                <Button
                  variant="soft"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {pagedPets.map((pet) => {
                  const imageUrl = photoByPetId[pet.id];

                  return (
                    <Card key={pet.id} size="2">
                      <Flex direction="column" gap="2">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={pet.name}
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            loading="lazy"
                          />
                        )}

                        <Heading size="4">{pet.name}</Heading>

                        <Text size="2" color="gray">
                          {pet.species || "Unknown"} •{" "}
                          {pet.breed || "Unknown breed"}
                        </Text>

                        <Text size="2" color="gray">
                          Age: {pet.age_years ?? "?"} • Size: {pet.size || "?"}
                        </Text>

                        <Link to={`/pets/${pet.id}`}>View full details</Link>
                      </Flex>
                    </Card>
                  );
                })}
              </div>
            )}

            {view === "details" && (
              <Flex direction="column" gap="3">
                {pagedPets.map((pet) => (
                  <Card key={pet.id} size="2">
                    <Flex direction="column" gap="2">
                      <Heading size="5">{pet.name}</Heading>
                      <Text size="2" color="gray">
                        Species: {pet.species || "Unknown"} • Breed:{" "}
                        {pet.breed || "Unknown"}
                      </Text>
                      <Text size="2" color="gray">
                        Age: {pet.age_years ?? "?"} • Sex: {pet.sex || "?"} •
                        Size: {pet.size || "?"}
                      </Text>
                      <Text size="2" color="gray">
                        Status: {pet.status || "?"}
                      </Text>
                      <Link to={`/pets/${pet.id}`}>View full details</Link>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}

            {view === "table" && (
              <Card size="2">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        {[
                          "Name",
                          "Species",
                          "Breed",
                          "Age",
                          "Sex",
                          "Size",
                          "Status",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.12)",
                              fontWeight: 600,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPets.map((pet) => (
                        <tr key={pet.id}>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.name}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.species || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.breed || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.age_years ?? "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.sex || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.size || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {pet.status || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <Link to={`/pets/${pet.id}`}>View full details</Link>
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
      </Flex>
    </div>
  );
}