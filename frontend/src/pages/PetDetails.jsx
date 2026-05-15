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

function PetPhoto({ photoUrl, petName }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="pet-photo-frame">
      {loading && (
        <div className="pet-photo-loading">
          <Spinner size={28} />
        </div>
      )}

      <img
        src={photoUrl}
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
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const photoUrls =
    pet.photos?.length > 0
      ? pet.photos.map((photo) => photo.url)
      : [pet.primary_photo_url || getPetPlaceholderImage(pet.species)];

  const currentPhotoUrl = photoUrls[photoIndex];

  function showPreviousPhoto() {
    setPhotoIndex((photoIndex - 1 + photoUrls.length) % photoUrls.length);
  }

  function showNextPhoto() {
    setPhotoIndex((photoIndex + 1) % photoUrls.length);
  }

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
        <div className="pet-slideshow">
  <div className="pet-slideshow-main">
    {photoUrls.length > 1 && (
      <button
        type="button"
        className="pet-slide-arrow left"
        onClick={showPreviousPhoto}
      >
        ‹
      </button>
    )}

    <PetPhoto photoUrl={currentPhotoUrl} petName={pet.name} />

    {photoUrls.length > 1 && (
      <button
        type="button"
        className="pet-slide-arrow right"
        onClick={showNextPhoto}
      >
        ›
      </button>
    )}
  </div>

  {photoUrls.length > 1 && (
    <>
      <div className="pet-slide-count">
        {photoIndex + 1} / {photoUrls.length}
      </div>

      <div className="pet-slide-thumbnails">
        {photoUrls.map((url, index) => (
          <button
            key={url}
            type="button"
            className={
              index === photoIndex
                ? "pet-slide-thumb active"
                : "pet-slide-thumb"
            }
            onClick={() => setPhotoIndex(index)}
          >
            <img src={url} alt={`${pet.name} ${index + 1}`} />
          </button>
        ))}
      </div>
    </>
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

      <p className="mt-32">
        <Link to="/">← Back to Home</Link>
      </p>
    </div>
  );
}