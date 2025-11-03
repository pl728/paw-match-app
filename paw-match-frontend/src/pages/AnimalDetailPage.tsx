import { useParams } from 'react-router-dom';

const AnimalDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Animal Detail Page</h1>
      <p style={{ fontSize: '18px', color: '#6b7280' }}>
        Viewing details for animal ID: <strong>{id}</strong>
      </p>
    </div>
  );
};

export default AnimalDetailPage;
