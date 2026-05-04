import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, Box, Button, Dialog } from "@radix-ui/themes";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { getMyProfile } from "../services/users.js";
import { deleteShelter } from "../services/shelters.js";
import { updatePet } from "../services/pets.js";

const STATUS_OPTIONS = ["available", "pending", "adopted"];
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

function getStatusBadgeColor(status) {
  if (status === "available") return "#52b788";
  if (status === "adopted") return "#6c757d";
  return "#d97706";
}

function buildPetStatusDrafts(pets) {
  return Object.fromEntries((pets || []).map((pet) => [pet.id, pet.status || "available"]));
}

function renderPetImage(pet, size, borderRadius = 12) {
  return (
    <img
      src={pet?.primary_photo_url || getPetPlaceholderImage(pet?.species)}
      alt={pet?.name || "Pet"}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: "cover",
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}
    />
  );
}

function ViewPetsAdmin() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [petStatusDrafts, setPetStatusDrafts] = useState({});
  const [savingPetId, setSavingPetId] = useState(null);
  const [editingPetId, setEditingPetId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  
  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setPetStatusDrafts(buildPetStatusDrafts(data?.pets));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePetStatusChange(petId, nextStatus) {
    setPetStatusDrafts((currentDrafts) => ({
      ...currentDrafts,
      [petId]: nextStatus,
    }));
    setStatusMessage("");
    setStatusError("");
  }

  function openPetEditor(pet) {
    setEditingPetId(pet.id);
    setPetStatusDrafts((currentDrafts) => ({
      ...currentDrafts,
      [pet.id]: currentDrafts[pet.id] || pet.status || "available",
    }));
    setStatusMessage("");
    setStatusError("");
  }

  function closePetEditor() {
    if (savingPetId) return;
    setEditingPetId(null);
  }

  async function handleSavePetStatus(pet) {
    const nextStatus = petStatusDrafts[pet.id] || pet.status;
    if (!nextStatus || nextStatus === pet.status) return;

    setSavingPetId(pet.id);
    setStatusMessage("");
    setStatusError("");

    try {
      const updatedPet = await updatePet(pet.id, { status: nextStatus });

      setProfile((currentProfile) => ({
        ...currentProfile,
        pets: currentProfile.pets.map((currentPet) =>
          currentPet.id === pet.id
            ? {
                ...currentPet,
                ...updatedPet,
                primary_photo_url:
                  updatedPet.primary_photo_url ||
                  currentPet.primary_photo_url ||
                  null,
              }
            : currentPet
        ),
      }));

      setPetStatusDrafts((currentDrafts) => ({
        ...currentDrafts,
        [pet.id]: updatedPet.status || nextStatus,
      }));

      setStatusMessage(
        `${pet.name}'s status was updated to ${prettyStatus(
          updatedPet.status || nextStatus
        )}.`
      );
      setEditingPetId(null);
    } catch (err) {
      setStatusError(err.message || "Could not update pet status.");
    } finally {
      setSavingPetId(null);
    }
  }
  // Function to render the grid of pets with edit options for shelter admins
  function renderPetsGrid() {
  if (!profile?.pets) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      }}
    >
      {profile.pets.map((pet) => (
        <Card key={pet.id} size="3">
            <Flex direction="column" gap="3">
                <Flex justify="between" align="start" gap="3">
                    <Flex align="start" gap="3" style={{ flex: 1 }}>
                        {renderPetImage(pet, 88, 14)}
                        <Box style={{ flex: 1 }}>
                            <Heading size="4">{pet.name}</Heading>
                            <Text size="2" color="gray">
                                {pet.species || "Unknown"} • {pet.breed || "Unknown breed"}
                            </Text>
                            <Text size="2" color="gray" style={{ display: "block", marginTop: 6 }}>
                                Age: {pet.age_years ?? "?"} • Sex: {pet.sex || "?"} • Size: {pet.size || "?"}
                            </Text>
                        </Box>
                    </Flex>

                    <Text
                        size="1"
                        style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        background: getStatusBadgeColor(pet.status),
                        color: "white",
                        whiteSpace: "nowrap",
                        }}
                    >
                        {prettyStatus(pet.status)}
                    </Text>
                </Flex>

                <Flex gap="2" wrap="wrap">
                    <Button onClick={() => openPetEditor(pet)}>Edit</Button>
                    <Button variant="soft" onClick={() => navigate(`/api/admin/pets/${pet.id}`)}>
                        View Pet Details
                    </Button>
                </Flex>
            </Flex>
</Card>

      ))}
    </div>
  );
}


  // Return all pets
  return (
    <Flex direction="column" gap="4">
      {loading && <Text>Loading...</Text>}
      {error && <Text color="red">{error}</Text>}

      {profile?.pets?.length > 0 ? (
        renderPetsGrid()
      ) : (
        <Text>No pets found.</Text>
      )}
    </Flex>
  );
}
export default ViewPetsAdmin;