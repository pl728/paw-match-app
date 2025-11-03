import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import dog1 from '../assets/dog1.jpg';

const HomePage = () => {
  const navigate = useNavigate();

  // Sample animal data
  const sampleAnimal = {
    id: '123',
    name: 'Buddy',
    type: 'dog' as const,
    breed: 'Golden Retriever',
    age: 3,
    gender: 'Male',
    size: 'Large',
    images: [dog1],
    disposition: ['Friendly', 'Good with kids', 'Energetic'],
    availability: 'Available' as const,
    shelter_id: 'shelter-1',
    date_created: '2025-01-01',
  };

  const handleCardClick = (animalId: string) => {
    navigate(`/animal/${animalId}`);
  };

  const handleSaveToggle = (animalId: string, isSaved: boolean) => {
    console.log(`Animal ${animalId} saved: ${isSaved}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Paw Match - Animal Profiles</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <ProfileCard
          animal={sampleAnimal}
          onCardClick={handleCardClick}
          onSaveToggle={handleSaveToggle}
        />
      </div>
    </div>
  );
};

export default HomePage;
