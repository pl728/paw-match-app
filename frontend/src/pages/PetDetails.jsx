import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPetById } from "../services/pets.js";
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

  const fallbackPhotoUrl =
    pet.primary_photo_url || getPetPlaceholderImage(pet.species);

  return (
    <div className="page">
      <p>
        <Link to="/">← Back to Home</Link>
      </p>

      <div className="pet-detail-header">
        <div>
          <h1>{pet.name}</h1>
          <p className="muted">
            {pet.species} • {pet.age_years} years old
          </p>
        </div>
        <StartConvo pet={pet} />
      </div>

      {pet.photos?.length > 0 ? (
        <div className="pet-photo-list">
          {pet.photos.map((photo) => (
            <PetPhoto key={photo.id} photo={photo} petName={pet.name} />
          ))}
        </div>
      ) : (
        <div className="pet-detail-image-wrap">
          <img
            src={fallbackPhotoUrl}
            alt={pet.name}
            className="pet-detail-main-image"
          />
        </div>
      )}

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
    </div>
  );
}