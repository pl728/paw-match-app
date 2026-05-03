import React from 'react'
import comingsoon from './assets/photo-coming-soon.png'
import CreatePet from './pages/CreatePet.jsx'
import BrowseShelters from './pages/BrowseShelters.jsx'
import UserLogin from './pages/UserLogin.jsx'
import FeedPage from './pages/FeedPage.jsx'
import PetDetails from './pages/PetDetails.jsx'
import Register from './pages/Register.jsx'
import AuthedHome from './pages/AuthedHome.jsx'
import Profile from './pages/Profile.jsx'
import SetupShelter from './pages/SetupShelter.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BrowseAllPets from "./pages/BrowseAllPets.jsx";
import Conversations from "./pages/Conversations.jsx";
import Chat from "./pages/Chat.jsx";
import Favorites from "./pages/Favorites.jsx";
import UserFAQ from "./pages/Footer/UserFAQ.jsx";
import AdminFAQ from "./pages/Footer/AdminFAQ.jsx";
import Discover from "./pages/Discover.jsx";
import ViewPetsAdmin from "./pages/ViewPetsAdmin.jsx";
import PetFinder from './pages/PetFinder.jsx'

import './App.css'

import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth/useAuth.js"


function Home() {
  return (
    <div className="page">
      <div className="landing">
        <header className="top-bar">
          <Link to="/" className="brand">
            <span className="brand-name">Paw Match</span>
          </Link>
        </header>

        <main className="hero hero-split">
          <div>
            <h1>Find a fur-ever friend</h1>
            <p className="muted">
              Browse adoptable pets from verified shelters. Save favorites and
              match by lifestyle in minutes.
            </p>

            <div className="cta-row">
              <Link to="/register" className="cta">Get started</Link>
            </div>

            <div className="stats">
              <div className="stat"><strong>Verified<br />Shelters</strong></div>
              <div className="stat"><strong>Keep your<br />Favorites</strong></div>
              <div className="stat"><strong>Easy<br />Applications</strong></div>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-card"></div>
            <div className="art-card small"></div>
          </div>
        </main>

        <section className="section">
          <h2>How it works</h2>
          <div className="grid3">
            <div className="card"><h3>Create a profile</h3><p className="muted">Tell us what you want.</p></div>
            <div className="card"><h3>Browse & favorite</h3><p className="muted">Save pets you love.</p></div>
            <div className="card"><h3>Meet & adopt</h3><p className="muted">Contact shelters easily.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
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
          You must be logged in as a shelter admin account to access this page.
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


function App() {
  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-content">
        <Routes>
          <Route path="/" element={<RedirectIfAuthed><Home /></RedirectIfAuthed>} />
          <Route path="/home" element={<RequireAuth><AuthedHome /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/setup-shelter" element={<RequireRole role="shelter_admin"><SetupShelter /></RequireRole>} />
          <Route path="/create-pet" element={<RequireRole role="shelter_admin"><CreatePet /></RequireRole>} />
          <Route path="/find-and-browse" element={<RequireAuth><Navigate to="/browse-pets" replace /></RequireAuth>} />
          <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
          <Route path="/pet-finder" element={<RequireAuth><PetFinder /></RequireAuth>} />
          <Route path="/browse-pets" element={<RequireAuth><BrowseAllPets /></RequireAuth>} />
          <Route path="/browse-shelters" element={<RequireAuth><BrowseShelters /></RequireAuth>} />
          <Route path="/feed" element={<RequireAuth><FeedPage /></RequireAuth>} />
          <Route path="/login" element={<RedirectIfAuthed><UserLogin /></RedirectIfAuthed>} />
          <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
          <Route path="/pets/:id" element={<PetDetails />} />
          <Route path="/conversations" element={<RequireAuth><Conversations /></RequireAuth>} />
          <Route path="/conversations/:id" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
          <Route path="/user-faq" element={<RequireAuth><UserFAQ /></RequireAuth>} />
          <Route path="/admin-faq" element={<RequireRole role="shelter_admin"><AdminFAQ /></RequireRole>} />
          <Route path="/view-admin-pets" element={<RequireRole role="shelter_admin"><ViewPetsAdmin /></RequireRole>} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;