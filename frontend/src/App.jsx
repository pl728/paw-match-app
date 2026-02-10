import React from 'react'
import pawmatchlogo from './assets/pawmatch_logo.png'
import CreatePet from './pages/CreatePet.jsx'
import ViewPets from './pages/ViewPets.jsx'
import BrowseShelters from './pages/BrowseShelters.jsx'
import UserLogin from './pages/UserLogin.jsx'
import FeedPage from './pages/FeedPage.jsx'
import PetDetails from './pages/PetDetails.jsx'
import Register from './pages/Register.jsx'
import AuthedHome from './pages/AuthedHome.jsx'
import Profile from './pages/Profile.jsx'
import SetupShelter from './pages/SetupShelter.jsx'
import Navbar from './components/Navbar.jsx'
import './App.css'
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth/AuthContext.jsx"

// References: 
// https://www.geeksforgeeks.org/reactjs/reactjs-components
// https://dev.to/techcheck/creating-a-react-node-and-express-app-1ieg

// Home page component

function Home() {
  return (
    <div className="landing" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
      <main className="hero">
        <h1>Find a fur-ever friend</h1>
        <p className="muted">
          Landing page placeholder. We will showcase featured pets, how matching works,
          and success stories here.
        </p>
        <div className="cta-row">
          <Link to="/register" className="cta">Get started</Link>
        </div>
      </main>
    </div>
  )
}

const AUTH_HOME = "/home";

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireRole({ role, children }) {
  const { isAuthed, user } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return (
      <div className="auth-gate">
        <h1>Access restricted</h1>
        <p className="muted">
          This area is for shelter accounts only.
        </p>
        <div className="cta-row">
          <Link to="/home" className="cta">Back to Home</Link>
        </div>
      </div>
    );
  }

  return children;
}

function RedirectIfAuthed({ children }) {
  const { isAuthed } = useAuth();

  if (isAuthed) {
    return <Navigate to={AUTH_HOME} replace />;
  }

  return children;
}

// Main App component with routing
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RedirectIfAuthed><Home /></RedirectIfAuthed>} />
        <Route path="/home" element={<RequireAuth><AuthedHome /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/setup-shelter" element={<RequireRole role="shelter_admin"><SetupShelter /></RequireRole>} />
        <Route path="/create-pet" element={<RequireRole role="shelter_admin"><CreatePet /></RequireRole>} />
        <Route path="/view-pets" element={<RequireAuth><ViewPets /></RequireAuth>} />
        <Route path="/browse-shelters" element={<RequireAuth><BrowseShelters /></RequireAuth>} />
        <Route path="/login" element={<RedirectIfAuthed><UserLogin /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
        <Route path="/user-login" element={<RedirectIfAuthed><UserLogin /></RedirectIfAuthed>} />
        <Route path="/pets/:id" element={<PetDetails />} />
      </Routes>
    </>
  );
}
export default App
