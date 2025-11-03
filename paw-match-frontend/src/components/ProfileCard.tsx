import { useState } from 'react';

interface Animal {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string;
  age: number;
  gender: string;
  size: string;
  images: string[];
  disposition: string[];
  availability: 'Available' | 'Pending' | 'Adopted' | 'Not Available';
  shelter_id: string;
  date_created: string;
}

interface ProfileCardProps {
  animal: Animal;
  onCardClick?: (animalId: string) => void;
  onSaveToggle?: (animalId: string, isSaved: boolean) => void;
  onContactShelter?: (shelterId: string) => void;
  showSaveButton?: boolean;
  showAvailabilityBadge?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  isSaved?: boolean;
  isViewed?: boolean;
  className?: string;
  imageAspectRatio?: string;
}

const ProfileCard = ({
  animal,
  onCardClick,
  onSaveToggle,
  showSaveButton = true,
  showAvailabilityBadge = true,
  isSaved = false,
  isViewed = false,
  className = '',
}: ProfileCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);

  // Event Handlers
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCardClick) {
      onCardClick(animal.id);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saveAnimating) return;

    setSaveAnimating(true);
    if (onSaveToggle) {
      onSaveToggle(animal.id, !isSaved);
    }
    setTimeout(() => setSaveAnimating(false), 300);
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleImageError = () => {
    console.error(`Failed to load image for ${animal.name}`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  // Utility Methods
  const getAvailabilityColor = (): string => {
    switch (animal.availability) {
      case 'Available':
        return '#10b981'; // green
      case 'Pending':
        return '#f59e0b'; // yellow
      case 'Adopted':
        return '#6b7280'; // gray
      case 'Not Available':
        return '#ef4444'; // red
      default:
        return '#6b7280';
    }
  };

  const formatAge = (): string => {
    if (animal.age < 1) {
      const months = Math.round(animal.age * 12);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${animal.age} year${animal.age !== 1 ? 's' : ''}`;
  };

  const getPrimaryImage = (): string => {
    if (animal.images && animal.images.length > 0) {
      return animal.images[currentImageIndex];
    }
    return 'https://placehold.co/400x300?text=No+Image';
  };

  const getDispositionIcons = () => {
    return animal.disposition.slice(0, 3).map((trait, index) => (
      <span
        key={index}
        style={{
          padding: '4px 8px',
          background: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        {trait}
      </span>
    ));
  };

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '300px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        margin: '20px',
        cursor: 'pointer',
        transition: 'all 300ms',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        opacity: isViewed ? 0.9 : 1,
        background: 'white',
        position: 'relative',
      }}
      className={className}
    >
      {/* Image Section */}
      <div style={{ position: 'relative', width: '100%', height: '225px', background: '#f3f4f6' }}>
        <img
          src={getPrimaryImage()}
          alt={`${animal.name} - ${animal.breed}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: isImageLoaded ? 1 : 0,
            transition: 'opacity 300ms',
          }}
        />

        {/* Save Button */}
        {showSaveButton && (
          <button
            onClick={handleSaveClick}
            aria-label={`Save ${animal.name}`}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: isSaved ? '#10b981' : 'white',
              color: isSaved ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: saveAnimating ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 150ms, background 200ms',
            }}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}

        {/* Availability Badge */}
        {showAvailabilityBadge && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: getAvailabilityColor(),
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {animal.availability}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{animal.name}</h3>
        <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
          {animal.breed} • {formatAge()} • {animal.gender}
        </p>

        {/* Disposition Icons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {getDispositionIcons()}
        </div>

        {/* Size info */}
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
          Size: {animal.size}
        </p>
      </div>
    </article>
  );
};

export default ProfileCard;
