import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, Box, Button } from "@radix-ui/themes";
import { getMyProfile } from "../services/users.js";

const PET_PLACEHOLDER_BY_SPECIES = {
  Cat: "/cat.png",
  Dog: "/dog.png",
};

function getPetPlaceholderImage(species) {
  return PET_PLACEHOLDER_BY_SPECIES[species] || "/animal.png";
}

function prettyStatus(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function renderPetImage(pet) {
  return (
    <img
      src={pet?.primary_photo_url || getPetPlaceholderImage(pet?.species)}
      alt={pet?.name || "Pet"}
      className="pet-image"
    />
  );
}

function ViewPetsAdmin() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    setError(null);

    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function renderPetsGrid() {
    if (!profile?.pets) return null;

    return (
      <div className="pets-grid">
        {profile.pets.map((pet) => (
          <Card key={pet.id} size="3">
            <Flex direction="column" gap="3">
              <Flex justify="between" align="start" gap="3">
                <Flex align="start" gap="3" className="flex-grow">
                  {renderPetImage(pet)}

                  <Box className="flex-grow">
                    <Heading size="4">{pet.name}</Heading>

                    <Text size="2" color="gray">
                      {pet.species || "Unknown"} • {pet.breed || "Unknown breed"}
                    </Text>

                    <Text size="2" color="gray" className="pet-meta">
                      Age: {pet.age_years ?? "?"} • Sex: {pet.sex || "?"} • Size: {pet.size || "?"}
                    </Text>
                  </Box>
                </Flex>

                <Text size="1" className={`status-badge ${pet.status}`}>
                  {prettyStatus(pet.status)}
                </Text>
              </Flex>

              <Flex gap="2" wrap="wrap">
                <Button onClick={() => navigate(`/edit-pet/${pet.id}`)}>
                  Edit
                </Button>

                <Button
                  variant="soft"
                  onClick={() => navigate(`/pets/${pet.id}`)}
                >
                  View Pet
                </Button>
              </Flex>
            </Flex>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="7">Manage Pets</Heading>
          <Text size="2" color="gray">
            View, edit, and manage pets listed by your shelter.
          </Text>
        </Box>

        <Flex justify="between" align="center" gap="3" wrap="wrap">
          <Button onClick={() => navigate("/create-pet")}>
            Add Pet
          </Button>
        </Flex>

        {loading && <Text>Loading...</Text>}

        {error && <Text color="red">{error}</Text>}

        {!loading && !error && profile?.pets?.length > 0 && renderPetsGrid()}

        {!loading && !error && (!profile?.pets || profile.pets.length === 0) && (
          <Card size="3" className="center-card">
            <Flex direction="column" gap="3" align="center">
              <Heading size="5">No Pets Found</Heading>
              <Text size="2" color="gray">
                Add your first pet to start managing your shelter listings.
              </Text>

              <Button onClick={() => navigate("/create-pet")}>
                Add Pet
              </Button>
            </Flex>
          </Card>
        )}
      </Flex>
    </div>
  );
}

export default ViewPetsAdmin;