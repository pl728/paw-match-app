import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { getAnimals } from '../services/animalService';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [animals, setAnimals] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCardClick = (animalId: string) => {
    navigate(`/animal/${animalId}`);
  };

  const handleSaveToggle = (animalId: string, isSaved: boolean) => {
    console.log(`Animal ${animalId} saved: ${isSaved}`);
  };

  const handleSearch = () => {
    const results = getAnimals(15);
    setAnimals(results);
    setHasSearched(true);
  };

  return (
    <div style={{ padding: '20px 60px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      <h1 style={{ marginBottom: '20px' }}>Search Animals</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for animals..."
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px'
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          Search
        </button>
      </div>

      {!hasSearched ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
          fontSize: '24px',
          color: '#6b7280'
        }}>
          Find your new pet
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
          justifyItems: 'center'
        }}>
          {animals.map((animal, index) => (
            <ProfileCard
              key={index}
              animal={animal}
              onCardClick={handleCardClick}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
