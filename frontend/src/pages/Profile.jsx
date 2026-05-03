import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, Box, Button, Dialog, Switch } from "@radix-ui/themes";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { getMyProfile } from "../services/users.js";
import { deleteShelter } from "../services/shelters.js";
import { updatePet } from "../services/pets.js";
import { createShelterPost, listShelterPosts, updateShelterPost, deleteShelterPost, publishShelterPost } from "../services/shelter_posts.js";
import { getEmailNotificationPrefs, updateEmailNotificationPrefs } from "../services/email_notifications.js";
import { AuthContext } from "../auth/context.js";

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

const DIGEST_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
  { value: "monthly", label: "Monthly digest" },
  { value: "none", label: "Never" },
];

function Profile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: "", body: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [publishingPostId, setPublishingPostId] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [newPostDraft, setNewPostDraft] = useState({ title: "", body: "", type: "update", publish: false });
  const [newPostSaving, setNewPostSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    fetchProfileData();
    if (user?.id) {
      fetchNotifPrefs();
    }
  }, []);

  async function fetchPosts(shelterId) {
    setPostsLoading(true);
    try {
      const result = await listShelterPosts({ shelterId });
      setPosts(result.items || []);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  function openPostEditor(post) {
    setEditingPost(post);
    setEditDraft({ title: post.title, body: post.body });
  }

  async function handleSavePost() {
    if (!editingPost) return;
    setEditSaving(true);
    try {
      const updated = await updateShelterPost(editingPost.id, editDraft);
      setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setEditingPost(null);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeletePost(postId) {
    setDeletingPostId(postId);
    try {
      await deleteShelterPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeletingPostId(null);
    }
  }

  async function handlePublishPost(postId) {
    setPublishingPostId(postId);
    try {
      const updated = await publishShelterPost(postId);
      setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } catch (err) {
      alert("Failed to publish: " + err.message);
    } finally {
      setPublishingPostId(null);
    }
  }

  async function handleCreatePost() {
    if (!profile?.shelter?.id) return;
    setNewPostSaving(true);
    try {
      const created = await createShelterPost({ shelterId: profile.shelter.id, ...newPostDraft });
      setPosts((prev) => [created, ...prev]);
      setCreatingPost(false);
      setNewPostDraft({ title: "", body: "", type: "update", publish: false });
    } catch (err) {
      alert("Failed to create post: " + err.message);
    } finally {
      setNewPostSaving(false);
    }
  }

  async function fetchNotifPrefs() {
    setNotifLoading(true);
    try {
      const prefs = await getEmailNotificationPrefs(user.id);
      setNotifPrefs(prefs);
    } catch {
      // silently fail — prefs not critical to page load
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleNotifToggle(field, value) {
    if (!user?.id) return;
    setNotifPrefs((prev) => ({ ...prev, [field]: value }));
    setNotifSaving(true);
    setNotifMessage("");
    try {
      const updated = await updateEmailNotificationPrefs(user.id, { [field]: value });
      setNotifPrefs(updated);
      setNotifMessage("Preferences saved.");
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [field]: !value }));
      setNotifMessage("Failed to save. Please try again.");
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleDigestChange(value) {
    if (!user?.id) return;
    setNotifPrefs((prev) => ({ ...prev, digest_frequency: value }));
    setNotifSaving(true);
    setNotifMessage("");
    try {
      const updated = await updateEmailNotificationPrefs(user.id, { digest_frequency: value });
      setNotifPrefs(updated);
      setNotifMessage("Preferences saved.");
    } catch {
      setNotifMessage("Failed to save. Please try again.");
    } finally {
      setNotifSaving(false);
    }
  }

  async function fetchProfileData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setPetStatusDrafts(buildPetStatusDrafts(data?.pets));
      if (data?.shelter?.id) {
        fetchPosts(data.shelter.id);
      }
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

  function renderPostsTab() {
    if (postsLoading) {
      return <Text size="2" color="gray">Loading posts…</Text>;
    }

    return (
      <Flex direction="column" gap="4">
        <Card size="3">
          <Flex justify="between" align="center">
            <Heading size="5">Shelter Posts</Heading>
            <Button onClick={() => setCreatingPost(true)}>New Post</Button>
          </Flex>
        </Card>

        <Dialog.Root open={creatingPost} onOpenChange={(open) => { if (!open) setCreatingPost(false); }}>
          <Dialog.Content maxWidth="520px">
            <Dialog.Title>New Post</Dialog.Title>
            <Flex direction="column" gap="4" mt="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Type</Text>
                <select
                  value={newPostDraft.type}
                  onChange={(e) => setNewPostDraft((d) => ({ ...d, type: e.target.value }))}
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                    background: "#2a2a2a", color: "#ffffff", padding: "10px 12px", font: "inherit"
                  }}
                >
                  <option value="update" style={{ background: "#2a2a2a", color: "#fff" }}>Update</option>
                  <option value="event" style={{ background: "#2a2a2a", color: "#fff" }}>Event</option>
                  <option value="news" style={{ background: "#2a2a2a", color: "#fff" }}>News</option>
                </select>
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Title</Text>
                <input
                  value={newPostDraft.title}
                  onChange={(e) => setNewPostDraft((d) => ({ ...d, title: e.target.value }))}
                  disabled={newPostSaving}
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)", color: "#e9eef5",
                    padding: "10px 12px", font: "inherit", boxSizing: "border-box"
                  }}
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Body</Text>
                <textarea
                  value={newPostDraft.body}
                  onChange={(e) => setNewPostDraft((d) => ({ ...d, body: e.target.value }))}
                  disabled={newPostSaving}
                  rows={5}
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)", color: "#e9eef5",
                    padding: "10px 12px", font: "inherit", resize: "vertical", boxSizing: "border-box"
                  }}
                />
              </label>
              <Flex align="center" gap="2">
                <input
                  type="checkbox"
                  id="publish-now"
                  checked={newPostDraft.publish}
                  onChange={(e) => setNewPostDraft((d) => ({ ...d, publish: e.target.checked }))}
                  disabled={newPostSaving}
                />
                <label htmlFor="publish-now">
                  <Text size="2">Publish immediately</Text>
                </label>
              </Flex>
              <Flex gap="3" justify="end">
                <Button variant="soft" color="gray" onClick={() => setCreatingPost(false)} disabled={newPostSaving}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost} disabled={newPostSaving || !newPostDraft.title || !newPostDraft.body}>
                  {newPostSaving ? "Saving…" : "Create Post"}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

        {posts.length === 0 ? (
          <Card size="3" style={{ textAlign: "center" }}>
            <Flex direction="column" gap="3" align="center">
              <Heading size="5">No Posts Yet</Heading>
              <Text size="2" color="gray">Posts you create will appear here.</Text>
            </Flex>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} size="3">
              <Flex direction="column" gap="2">
                <Flex justify="between" align="start" gap="3">
                  <Box style={{ flex: 1 }}>
                    <Heading size="4">{post.title}</Heading>
                    <Text size="1" color="gray">
                      {post.published_at ? "Published " + new Date(post.published_at).toLocaleDateString() : "Draft"}
                    </Text>
                  </Box>
                  <Flex gap="2" shrink="0">
                    <Button size="2" variant="soft" onClick={() => openPostEditor(post)}>
                      Edit
                    </Button>
                    {!post.published_at && (
                      <Button size="2" variant="soft" color="green" onClick={() => handlePublishPost(post.id)} disabled={publishingPostId === post.id}>
                        {publishingPostId === post.id ? "Publishing…" : "Publish"}
                      </Button>
                    )}
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <Button size="2" color="red" variant="soft" disabled={deletingPostId === post.id}>
                          {deletingPostId === post.id ? "Deleting…" : "Delete"}
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
                            Delete this post?
                          </AlertDialog.Title>
                          <AlertDialog.Description style={{
                            fontSize: "0.95rem",
                            color: "#5d3a2a",
                            marginBottom: "24px",
                            lineHeight: 1.6,
                            display: "block"
                          }}>
                            This will permanently delete &ldquo;{post.title}&rdquo;. This action cannot be undone.
                          </AlertDialog.Description>
                          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <AlertDialog.Cancel asChild>
                              <Button variant="soft" color="gray" size="2">Cancel</Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <Button color="red" size="2" onClick={() => handleDeletePost(post.id)}>Delete</Button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </Flex>
                </Flex>
                <Text size="2" color="gray" style={{ whiteSpace: "pre-wrap" }}>{post.body}</Text>
              </Flex>
            </Card>
          ))
        )}

        <Dialog.Root open={!!editingPost} onOpenChange={(open) => { if (!open) setEditingPost(null); }}>
          <Dialog.Content maxWidth="520px">
            <Dialog.Title>Edit Post</Dialog.Title>
            <Flex direction="column" gap="4" mt="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Title</Text>
                <input
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                  disabled={editSaving}
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)", color: "#e9eef5",
                    padding: "10px 12px", font: "inherit", boxSizing: "border-box"
                  }}
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Body</Text>
                <textarea
                  value={editDraft.body}
                  onChange={(e) => setEditDraft((d) => ({ ...d, body: e.target.value }))}
                  disabled={editSaving}
                  rows={6}
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)", color: "#e9eef5",
                    padding: "10px 12px", font: "inherit", resize: "vertical", boxSizing: "border-box"
                  }}
                />
              </label>
              <Flex gap="3" justify="end">
                <Button variant="soft" color="gray" onClick={() => setEditingPost(null)} disabled={editSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSavePost} disabled={editSaving || !editDraft.title || !editDraft.body}>
                  {editSaving ? "Saving…" : "Save"}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    );
  }

  function renderNotificationsTab() {
    if (notifLoading || !notifPrefs) {
      return <Text size="2" color="gray">Loading preferences…</Text>;
    }

    const toggles = [
      { field: "adoption_updates", label: "Adoption updates", description: "When a pet you're following is adopted" },
      { field: "saved_animal_updates", label: "Saved animal updates", description: "When a favorited pet's status changes" },
      { field: "new_match_alerts", label: "New match alerts", description: "When a new pet matches your preferences" },
      { field: "reminders", label: "Reminders", description: "Periodic reminders about pets you've saved" },
    ];

    return (
      <Flex direction="column" gap="4">
        <Card size="3">
          <Flex direction="column" gap="4">
            <Heading size="5">Email Notifications</Heading>

            {toggles.map(({ field, label, description }) => (
              <Flex key={field} justify="between" align="center" gap="4">
                <Box>
                  <Text size="2" weight="bold" as="div">{label}</Text>
                  <Text size="2" color="gray">{description}</Text>
                </Box>
                <Switch
                  checked={!!notifPrefs[field]}
                  onCheckedChange={(checked) => handleNotifToggle(field, checked)}
                  disabled={notifSaving}
                />
              </Flex>
            ))}
          </Flex>
        </Card>

        <Card size="3">
          <Flex direction="column" gap="3">
            <Heading size="5">Digest Frequency</Heading>
            <Text size="2" color="gray">How often would you like to receive email summaries?</Text>
            <select
              value={notifPrefs.digest_frequency || "none"}
              onChange={(e) => handleDigestChange(e.target.value)}
              disabled={notifSaving}
              style={{
                width: "100%",
                maxWidth: 280,
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "#2a2a2a",
                color: "#ffffff",
                padding: "10px 12px",
                font: "inherit",
              }}
            >
              {DIGEST_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value} style={{ background: "#2a2a2a", color: "#ffffff" }}>
                  {label}
                </option>
              ))}
            </select>
          </Flex>
        </Card>

        {notifMessage && (
          <Text size="2" color={notifMessage.startsWith("Failed") ? "red" : "green"}>
            {notifMessage}
          </Text>
        )}
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
            {profile.role === "shelter_admin" && (
              <Button
                variant={activeTab === "posts" ? "solid" : "soft"}
                onClick={() => setActiveTab("posts")}
              >
                Posts
              </Button>
            )}
            <Button
              variant={activeTab === "notifications" ? "solid" : "soft"}
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </Button>
          </Flex>
        </Card>

        {activeTab === "profile" && renderOverviewTab()}
        {activeTab === "pets" && renderPetsTab()}
        {activeTab === "posts" && renderPostsTab()}
        {activeTab === "notifications" && renderNotificationsTab()}
      </Flex>
    </div>
  );
}

export default Profile;
