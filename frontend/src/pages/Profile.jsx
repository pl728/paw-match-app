import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, Box, Button, Dialog } from "@radix-ui/themes";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { getMyProfile } from "../services/users.js";
import { deleteShelter } from "../services/shelters.js";
import { updatePet } from "../services/pets.js";

const STATUS_OPTIONS = ["available", "pending", "adopted"];

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
  if (pet?.primary_photo_url) {
    return (
      <img
        src={pet.primary_photo_url}
        alt={pet.name || "Pet"}
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

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}
    />
  );
}

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [petView, setPetView] = useState("grid");
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

  async function handleDeleteShelter() {
    if (!profile?.shelter?.id) return;

    setDeleting(true);
    try {
      await deleteShelter(profile.shelter.id);
      await fetchProfileData();
      setActiveTab("profile");
    } catch (err) {
      alert(`Error deleting shelter: ${err.message}`);
    } finally {
      setDeleting(false);
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
    if (!nextStatus || nextStatus === pet.status) {
      return;
    }

    setSavingPetId(pet.id);
    setStatusMessage("");
    setStatusError("");

    try {
      const updatedPet = await updatePet(pet.id, { status: nextStatus });

      setProfile((currentProfile) => {
        if (!currentProfile) return currentProfile;

        return {
          ...currentProfile,
          pets: (currentProfile.pets || []).map((currentPet) =>
            currentPet.id === pet.id
              ? {
                  ...currentPet,
                  ...updatedPet,
                  primary_photo_url: updatedPet.primary_photo_url || currentPet.primary_photo_url || null,
                }
              : currentPet
          ),
        };
      });

      setPetStatusDrafts((currentDrafts) => ({
        ...currentDrafts,
        [pet.id]: updatedPet.status || nextStatus,
      }));
      setStatusMessage(`${pet.name}'s status was updated to ${prettyStatus(updatedPet.status || nextStatus)}.`);
      setEditingPetId(null);
    } catch (err) {
      setStatusError(err.message || "Could not update pet status.");
    } finally {
      setSavingPetId(null);
    }
  }

  function renderOverviewTab() {
    return (
      <Flex direction="column" gap="4">
        <Card size="3">
          <Flex direction="column" gap="3">
            <Heading size="6">Profile</Heading>

            <Box>
              <Text size="2" weight="bold" as="div">Username</Text>
              <Text size="2" color="gray">{profile.username}</Text>
            </Box>

            <Box>
              <Text size="2" weight="bold" as="div">Role</Text>
              <Text size="2" color="gray">
                {profile.role === "shelter_admin" ? "Shelter Admin" : "Adopter"}
              </Text>
            </Box>

            <Box>
              <Text size="2" weight="bold" as="div">Member since</Text>
              <Text size="2" color="gray">
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </Box>
          </Flex>
        </Card>

        {profile.role === "shelter_admin" && !profile.shelter && (
          <Card size="3" style={{ textAlign: "center" }}>
            <Flex direction="column" gap="3" align="center">
              <Heading size="5">Set Up Your Shelter</Heading>
              <Text size="2" color="gray">
                You need to create a shelter profile before you can add pets.
              </Text>
              <Button size="3" onClick={() => navigate("/setup-shelter")}>
                Create Shelter
              </Button>
            </Flex>
          </Card>
        )}

        {profile.role === "shelter_admin" && profile.shelter && (
          <Card size="3">
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center" gap="3" wrap="wrap">
                <Heading size="5">Shelter Information</Heading>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <Button color="red" variant="soft" size="2">
                      Delete Shelter
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay style={{
                      position: "fixed",
                      inset: 0,
                      background: "rgba(0, 0, 0, 0.5)",
                      zIndex: 9998
                    }} />
                    <AlertDialog.Content style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "90%",
                      maxWidth: "500px",
                      background: "white",
                      borderRadius: "12px",
                      padding: "24px",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                      zIndex: 9999
                    }}>
                      <AlertDialog.Title style={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        marginBottom: "12px",
                        color: "#2d1810",
                        display: "block"
                      }}>
                        Delete Shelter?
                      </AlertDialog.Title>
                      <AlertDialog.Description style={{
                        fontSize: "0.95rem",
                        color: "#5d3a2a",
                        marginBottom: "24px",
                        lineHeight: 1.6,
                        display: "block"
                      }}>
                        This will permanently delete your shelter and <strong>all {profile.pets?.length || 0} pets</strong> associated with it. This action cannot be undone.
                      </AlertDialog.Description>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                          <Button variant="soft" color="gray" size="2">
                            Cancel
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button color="red" size="2" onClick={handleDeleteShelter} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete Shelter"}
                          </Button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </Flex>

              <Box>
                <Text size="2" weight="bold" as="div">Name</Text>
                <Text size="2" color="gray">{profile.shelter.name}</Text>
              </Box>

              {profile.shelter.description && (
                <Box>
                  <Text size="2" weight="bold" as="div">Description</Text>
                  <Text size="2" color="gray">{profile.shelter.description}</Text>
                </Box>
              )}

              {profile.shelter.phone && (
                <Box>
                  <Text size="2" weight="bold" as="div">Phone</Text>
                  <Text size="2" color="gray">{profile.shelter.phone}</Text>
                </Box>
              )}

              {profile.shelter.email && (
                <Box>
                  <Text size="2" weight="bold" as="div">Email</Text>
                  <Text size="2" color="gray">{profile.shelter.email}</Text>
                </Box>
              )}

              {(profile.shelter.address_line1 || profile.shelter.city) && (
                <Box>
                  <Text size="2" weight="bold" as="div">Address</Text>
                  <Text size="2" color="gray">
                    {profile.shelter.address_line1 && <>{profile.shelter.address_line1}<br /></>}
                    {profile.shelter.address_line2 && <>{profile.shelter.address_line2}<br /></>}
                    {profile.shelter.city && profile.shelter.state &&
                      `${profile.shelter.city}, ${profile.shelter.state} ${profile.shelter.postal_code || ""}`
                    }
                  </Text>
                </Box>
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    );
  }

  function renderPetsGrid() {
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
                    whiteSpace: "nowrap"
                  }}
                >
                  {prettyStatus(pet.status)}
                </Text>
              </Flex>

              <Flex gap="2" wrap="wrap">
                <Button onClick={() => openPetEditor(pet)}>
                  Edit
                </Button>
                <Button variant="soft" onClick={() => navigate(`/pets/${pet.id}`)}>
                  View Pet
                </Button>
              </Flex>
            </Flex>
          </Card>
        ))}
      </div>
    );
  }

  function renderPetsTable() {
    return (
      <Card size="3">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Name", "Species", "Breed", "Age", "Sex", "Size", "Status", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                      fontWeight: 600,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.pets.map((pet) => {
                return (
                  <tr key={pet.id}>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <Flex align="center" gap="3">
                        {renderPetImage(pet, 48, 10)}
                        <Text size="2">{pet.name}</Text>
                      </Flex>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{pet.species || "—"}</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{pet.breed || "—"}</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{pet.age_years ?? "—"}</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{pet.sex || "—"}</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{pet.size || "—"}</td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", minWidth: 120 }}>
                      <Text
                        size="1"
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: getStatusBadgeColor(pet.status),
                          color: "white",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {prettyStatus(pet.status)}
                      </Text>
                    </td>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <Flex gap="2" wrap="wrap">
                        <Button size="2" onClick={() => openPetEditor(pet)}>
                          Edit
                        </Button>
                        <Button size="2" variant="soft" onClick={() => navigate(`/pets/${pet.id}`)}>
                          View
                        </Button>
                      </Flex>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function renderPetEditDialog() {
    const pet = (profile?.pets || []).find((item) => item.id === editingPetId);
    if (!pet) {
      return null;
    }

    const draftStatus = petStatusDrafts[pet.id] || pet.status || "available";
    const isSaving = savingPetId === pet.id;
    const isDirty = draftStatus !== pet.status;

    return (
      <Dialog.Root open={Boolean(editingPetId)} onOpenChange={(open) => {
        if (!open) closePetEditor();
      }}>
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>Edit Pet</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            Update {pet.name}&apos;s adoption details and save when you&apos;re ready.
          </Dialog.Description>

          <Flex direction="column" gap="4" mt="4">
            <Card size="2" variant="surface">
              <Flex align="center" gap="3">
                {renderPetImage(pet, 88, 14)}
                <Flex direction="column" gap="2">
                  <Heading size="4">{pet.name}</Heading>
                  <Text size="2" color="gray">
                    {pet.species || "Unknown"} • {pet.breed || "Unknown breed"}
                  </Text>
                  <Text size="2" color="gray">
                    Age: {pet.age_years ?? "?"} • Sex: {pet.sex || "?"} • Size: {pet.size || "?"}
                  </Text>
                </Flex>
              </Flex>
            </Card>

            <label>
              <Text as="div" size="2" mb="1" weight="bold">Adoption Status</Text>
              <select
                value={draftStatus}
                onChange={(event) => handlePetStatusChange(pet.id, event.target.value)}
                disabled={isSaving}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#e9eef5",
                  padding: "10px 12px",
                  font: "inherit"
                }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status} style={{ color: "#111" }}>
                    {prettyStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <Flex gap="3" justify="end">
              <Button variant="soft" color="gray" onClick={closePetEditor} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={() => handleSavePetStatus(pet)} disabled={!isDirty || isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  function renderPetsTab() {
    if (!profile.shelter) {
      return (
        <Card size="3" style={{ textAlign: "center" }}>
          <Flex direction="column" gap="3" align="center">
            <Heading size="5">No Shelter Yet</Heading>
            <Text size="2" color="gray">
              Create your shelter profile first, then you can add and manage pets here.
            </Text>
            <Button size="3" onClick={() => navigate("/setup-shelter")}>
              Create Shelter
            </Button>
          </Flex>
        </Card>
      );
    }

    return (
      <Flex direction="column" gap="4">
        <Card size="3">
          <Flex direction={{ initial: "column", sm: "row" }} gap="3" justify="between" align={{ initial: "start", sm: "center" }}>
            <Box>
              <Heading size="5">Manage Pets</Heading>
              <Text size="2" color="gray">
                Switch views and update each pet&apos;s adoption status from here.
              </Text>
            </Box>

            <Flex gap="2" wrap="wrap" align="center">
              <Button
                variant={petView === "grid" ? "solid" : "soft"}
                onClick={() => setPetView("grid")}
              >
                Grid
              </Button>
              <Button
                variant={petView === "table" ? "solid" : "soft"}
                onClick={() => setPetView("table")}
              >
                Table
              </Button>
              <Button variant="soft" onClick={() => navigate("/create-pet")}>
                Add Pet
              </Button>
            </Flex>
          </Flex>
        </Card>

        {(statusMessage || statusError) && (
          <Card size="2" style={{ borderColor: statusError ? "rgba(255, 99, 99, 0.4)" : "rgba(82, 183, 136, 0.45)" }}>
            <Text size="2" color={statusError ? "red" : "green"}>
              {statusError || statusMessage}
            </Text>
          </Card>
        )}

        {profile.pets?.length > 0 ? (
          petView === "grid" ? renderPetsGrid() : renderPetsTable()
        ) : (
          <Card size="3" style={{ textAlign: "center" }}>
            <Flex direction="column" gap="3" align="center">
              <Heading size="5">No Pets Added Yet</Heading>
              <Text size="2" color="gray">
                Add your first pet to start managing statuses and showing up in the feed.
              </Text>
              <Button size="3" onClick={() => navigate("/create-pet")}>
                Add Pet
              </Button>
            </Flex>
          </Card>
        )}

        {renderPetEditDialog()}
      </Flex>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 20px" }}>
        <Text size="2" color="gray">Loading profile…</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 20px" }}>
        <Text size="2" color="red">{error}</Text>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 20px" }}>
      <Flex direction="column" gap="4">
        <Box>
          <Heading size="7">Account</Heading>
          <Text size="2" color="gray">
            Manage your profile, shelter setup, and pet statuses in one place.
          </Text>
        </Box>

        <Card size="2">
          <Flex gap="2" wrap="wrap">
            <Button
              variant={activeTab === "profile" ? "solid" : "soft"}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </Button>
            {profile.role === "shelter_admin" && (
              <Button
                variant={activeTab === "pets" ? "solid" : "soft"}
                onClick={() => setActiveTab("pets")}
              >
                Pets
              </Button>
            )}
          </Flex>
        </Card>

        {activeTab === "profile" ? renderOverviewTab() : renderPetsTab()}
      </Flex>
    </div>
  );
}

export default Profile;
