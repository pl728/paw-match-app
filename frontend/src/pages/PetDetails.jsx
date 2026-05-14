import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPetById } from "../services/pets.js";
import { getShelterById } from "../services/shelters.js";
import Spinner from "../components/ui/spinner.jsx";
import StartConvo from "../pages/StartConvo.jsx";

const PET_PLACEHOLDER_BY_SPECIES = {
  Cat: "/cat.png",
  Dog: "/dog.png",
};

function getPetPlaceholderImage(species) {
  return PET_PLACEHOLDER_BY_SPECIES[species] || "/animal.png";
}

function PetPhoto({ photo, petName }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="pet-photo-frame">
      {loading && (
        <div className="pet-photo-loading">
          <Spinner size={28} />
        </div>
      )}

      <img
        src={photo.url}
        alt={petName}
        className="pet-detail-photo"
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}

export default function PetDetails() {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPet() {
      try {
        const data = await getPetById(id);
        setPet(data);

        if (data.shelter_id) {
          const shelterData = await getShelterById(data.shelter_id);
          setShelter(shelterData);
        }
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

  const fallbackPhotoUrl =
    pet.primary_photo_url || getPetPlaceholderImage(pet.species);

  return (
    <div className="page">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "40px",
          alignItems: "start",
        }}
      >
        <div>
          {pet.photos?.length > 0 ? (
            <PetPhoto photo={pet.photos[0]} petName={pet.name} />
          ) : (
            <img
              src={fallbackPhotoUrl}
              alt={pet.name}
              className="pet-detail-main-image"
            />
          )}
        </div>

        <div>
          <h1>{pet.name}</h1>

          <p className="muted">
            {pet.species} • {pet.age_years} years old
          </p>

          {pet.description && <p>{pet.description}</p>}

          <div style={{ marginTop: "20px", marginBottom: "28px" }}>
            <StartConvo pet={pet} />
          </div>

          {shelter && (
            <div
              style={{
                background: "rgba(255,255,255,0.75)",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(47,143,168,0.2)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Shelter Information</h3>

              <p>
                <strong>{shelter.name}</strong>
                {shelter.city && ` — ${shelter.city}`}
              </p>

              {shelter.description && <p>{shelter.description}</p>}

              <p>
                {shelter.phone && (
                  <>
                    <strong>Phone:</strong> {shelter.phone}
                    <br />
                  </>
                )}

                {shelter.email && (
                  <>
                    <strong>Email:</strong> {shelter.email}
                    <br />
                  </>
                )}

                {(shelter.address_line1 || shelter.city) && (
                  <>
                    <strong>Address:</strong>{" "}
                    {[
                      shelter.address_line1,
                      shelter.address_line2,
                      shelter.city,
                      shelter.state,
                      shelter.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {pet.photos?.length > 1 && (
        <>
          <h2 style={{ marginTop: "48px" }}>More Photos</h2>

          <div className="pet-photo-list">
            {pet.photos.slice(1).map((photo) => (
              <PetPhoto key={photo.id} photo={photo} petName={pet.name} />
            ))}
          </div>
        </>
      )}

      <p className="mt-32">
        <Link to="/">← Back to Home</Link>
      </p>
    </div>
  );
}