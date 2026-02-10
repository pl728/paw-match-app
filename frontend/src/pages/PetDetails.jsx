import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function PetDetails() {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPet() {
      try {
        const response = await fetch(`/pets/${id}`);

        if (!response.ok) {
          throw new Error("Pet not found");
        }

        const data = await response.json();
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
              <img
                key={photo.id}
                src={photo.url}
                alt={pet.name}
                width="250"
                style={{ borderRadius: "8px" }}
              />
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
