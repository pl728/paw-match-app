import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";
import photo from "../assets/photo-coming-soon.png";


function BrowsePets() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter pets by species, adoptable status, or shelter location
    const [speciesFilter, setSpeciesFilter] = useState("all");     
    const [statusFilter, setStatusFilter] = useState("all");
    const [shelterFilter, setShelterFilter] = useState("all");

    useEffect(() => {
        let isActive = true;
        async function fetchPets() {
            try {
                const data = await getPets();
                if (isActive) {
                    setPets(data);
                }
            } catch (err) {
                if (isActive) {
                    setError(err.message);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }
        fetchPets();
        return () => {
            isActive = false;
        };
    }, []);    
    // Add filter logic 
    const filteredPets = useMemo(() => {
        return pets.filter((pet) => {
            if(speciesFilter !== "all" && pet.species !== speciesFilter) 
                return false;
            if(statusFilter !== "all" && pet.status !== statusFilter) 
                return false;
            if(shelterFilter !== "all" && pet.shelter_name !== shelterFilter)
                return false;
            return true;
        });
     }, [pets, speciesFilter, statusFilter, shelterFilter] );
     // Fill dropdown options for filters based on available pets
     const speciesOptions = ["all", ...new Set(pets.map(p => p.species || ""))];
     const statusOptions = ["all",  ...Array.from(new Set(pets.map(p => p.shelter_name).filter(Boolean)))];
     const shelterOptions = ["all", ...new Set(pets.map(p => p.shelter_name || ""))];   

        
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 20px" }}>
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="3">
          <Heading size="6">Browse Pets</Heading>

          {/* Filters */}
          <Flex gap="2" wrap="wrap">
            <label>
              Species:
              <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)}>
                {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label>
              Status:
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label>
              Shelter:
              <select value={shelterFilter} onChange={e => setShelterFilter(e.target.value)}>
                {shelterOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </Flex>

          {loading && <Text size="2" color="gray">Loading pets…</Text>}
          {error && <Text size="2" color="red">{error}</Text>}

          {!loading && !error && filteredPets.length === 0 && (
            <Text size="2" color="gray">No pets found.</Text>
          )}

          {!loading && !error && filteredPets.length > 0 && (
            <Flex direction="column" gap="3">
              {filteredPets.map(pet => (
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
                      <Text size="2" color="white">{pet.species} • {pet.breed || "Unknown Breed"} • {pet.age_years || "Unknown"} Years</Text>
                      <Text size="2" color="white"> Gender: {pet.sex || "Unknown"}</Text>
                      <Text size="2" color="white"> Size: {pet.size || "Unknown"}</Text>
                      <Text size="2" color="white">{pet.shelter_name}</Text>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Flex>
      </Card>
    </div>
  );
}
export default BrowsePets;
