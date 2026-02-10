import React from 'react'
import pawmatchlogo from './assets/pawmatch_logo.png'
import CreatePet from './pages/CreatePet.jsx' 
import ViewPets from './pages/ViewPets.jsx'
import UserLogin from './pages/UserLogin.jsx'
import PetDetails from './pages/PetDetails.jsx'
import Register from './pages/Register.jsx'
import AuthedHome from './pages/AuthedHome.jsx'
import './App.css'
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth/AuthContext.jsx"

// References: 
// https://www.geeksforgeeks.org/reactjs/reactjs-components
// https://dev.to/techcheck/creating-a-react-node-and-express-app-1ieg

// Home page component

function Home() {
  return (
    <div className="landing">
      <header className="top-bar">
        <Link className="brand" to="/">
          <img src={pawmatchlogo} className="logo" alt="Pawmatch logo"/>
          <span className="brand-name">PawMatch</span>
        </Link>
        <nav className="auth-links">
          <Link to="/login">Log In</Link>
          <Link className="primary" to="/register">Register</Link>
        </nav>
      </header>

      <main className="hero">
        <h1>Find a fur-ever friend</h1>
        <p className="muted">
          Landing page placeholder. We will showcase featured pets, how matching works,
          and success stories here.
        </p>
        <div className="cta-row">
          <Link to="/register" className="cta">Get started</Link>
          <Link to="/login" className="cta ghost">Log in</Link>
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
    <Routes>
      <Route path="/" element={<RedirectIfAuthed><Home /></RedirectIfAuthed>} />
      <Route path="/home" element={<RequireAuth><AuthedHome /></RequireAuth>} />
      <Route path="/create-pet" element={<RequireRole role="shelter_admin"><CreatePet /></RequireRole>} />
      <Route path="/view-pets" element={<RequireAuth><ViewPets /></RequireAuth>} />
      <Route path="/login" element={<RedirectIfAuthed><UserLogin /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
      <Route path="/user-login" element={<RedirectIfAuthed><UserLogin /></RedirectIfAuthed>} />
      <Route path="/pets/:id" element={<PetDetails />} />
    </Routes>
  );
}
export default App
