import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPetById } from "../services/pets.js";
import Spinner from "../components/ui/spinner.jsx";

function PetPhoto({ photo, petName }) {
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        position: "relative",
        width: 250,
        minHeight: 180,
        borderRadius: "8px",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.06)",
      }}
    >
      {loading ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11, 12, 16, 0.55)",
          }}
        >
          <Spinner size={28} label="Loading pet photo" />
        </div>
      ) : null}

      <img
        src={photo.url}
        alt={petName}
        width="250"
        style={{ borderRadius: "8px", display: "block" }}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}

export default function PetDetails() {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPet() {
      try {
        const data = await getPetById(id);
        setPet(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPet();
  }, [id]);

  if (loading) return <p>Loading pet details…</p>;
  if (error) return <p>{error}</p>;
  if (!pet) return <p>No pet found.</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1>{pet.name}</h1>

      <p>
        {pet.species} • {pet.age_years} years old
      </p>

      {pet.description && <p>{pet.description}</p>}

      {pet.shelter && (
        <>
          <h3>Shelter</h3>
          <p>
            {pet.shelter.name}
            {pet.shelter.city && ` — ${pet.shelter.city}`}
          </p>
        </>
      )}

      {pet.photos?.length > 0 && (
        <>
          <h3>Photos</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {pet.photos.map((photo) => (
              <PetPhoto key={photo.id} photo={photo} petName={pet.name} />
            ))}
          </div>
        </>
      )}

      <p style={{ marginTop: "2rem" }}>
        <Link to="/">← Back to Home</Link>
      </p>
    </div>
  );
}
