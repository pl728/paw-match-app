import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Dashboard</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          Log Out
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={() => navigate('/search')}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          Search Animals
        </button>
      </div>
    </div>
  );
};

export default HomePage;
