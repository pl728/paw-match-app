import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPetById, updatePet } from "../services/pets.js";
import { Button } from "@radix-ui/themes";

export default function PetDetailsAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Photo upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Load pet on mount
  useEffect(() => {
    async function loadPet() {
      try {
        const data = await getPetById(id);
        setPet(data);
        console.log("PetDetailsAdmin loaded pet:", data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPet();
  }, [id]);

  // Initialize edit fields when pet loads
  useEffect(() => {
    if (pet) {
      setEditStatus(pet.status);
      setEditAge(pet.ageYears ?? pet.age_years);
      setEditDescription(pet.description || "");
    }
  }, [pet]);

  // Save handler
  async function handleSave() {
    try {
      const updated = await updatePet(pet.id, {
        status: editStatus,
        age_years: Number(editAge),
        description: editDescription
      });

      setPet(updated);      // refresh UI
      setEditing(false);    // close editor
    } catch (err) {
      console.error(err);
      alert("Could not update pet.");
    }
  }

  // Photo upload handler
  async function handleUploadPhoto() {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await fetch(`/api/pets/${pet.id}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const newPhoto = await res.json();

      // Update UI with new photo
      setPet((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), newPhoto],
      }));

      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!pet) return <p>Pet not found.</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <button onClick={() => navigate(-1)} style={{backgroundColor: "#2b2b2b"}}>← Back</button>

      <Button onClick={() => setEditing(true)} style={{ marginTop: "1rem" }}>
        Edit Pet
      </Button>

      <h1>{pet.name}</h1>

      <p><strong>Species:</strong> {pet.species}</p>
      <p><strong>Breed:</strong> {pet.breed}</p>
      <p><strong>Age:</strong> {pet.ageYears ?? pet.age_years}</p>
      <p><strong>Sex:</strong> {pet.sex}</p>
      <p><strong>Size:</strong> {pet.size}</p>
      <p><strong>Status:</strong> {pet.status}</p>

      {pet.description && (
        <p><strong>Description:</strong> {pet.description}</p>
      )}

      <img
        src={pet.primary_photo_url || "/animal.png"}
        alt={pet.name}
        style={{ width: "100%", maxWidth: 420, borderRadius: 12 }}
      />

      {/* PHOTO UPLOAD SECTION */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3>Upload New Photo</h3>

        <input
          type="file"
          accept="image/*"
          id="pet-photo-input"
          style={{ display: "none" }}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <Button
          onClick={() => document.getElementById("pet-photo-input").click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Choose Photo"}
        </Button>

        {selectedFile && (
          <Button
            style={{ marginLeft: 10 }}
            onClick={handleUploadPhoto}
            disabled={uploading}
          >
            Upload
          </Button>
        )}
      </div>

      {/* PHOTO GALLERY */}
      {pet.photos?.length > 0 && (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>Photos</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {pet.photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={pet.name}
                style={{
                  width: 200,
                  height: 150,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #ddd"
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* EDIT FORM */}
      {editing && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#2b2b2b"
          }}
        >
          <h2>Edit Pet Details</h2>

          <label>
            Status:
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="adopted">Adopted</option>
            </select>
          </label>

          <br /><br />

          <label>
            Age (Years):
            <input
              type="number"
              value={editAge}
              onChange={(e) => setEditAge(e.target.value)}
              style={{ marginLeft: 8, width: 80 }}
            />
          </label>

          <br /><br />

          <label>
            Description:
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 8 }}
            />
          </label>

          <br />

          <Button onClick={handleSave}>Save Changes</Button>
          <Button
            variant="soft"
            style={{ marginLeft: 8 }}
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
