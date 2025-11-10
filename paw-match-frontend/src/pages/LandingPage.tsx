import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center'
    }}>
      <h1>Paw Match</h1>
      <p>Find your perfect pet companion</p>
      <button
        onClick={() => navigate('/home')}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
