import React from 'react'
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
import VerifyEmail from './pages/VerifyEmail.jsx'
import About from "./pages/Footer/About.jsx";
import Team from "./pages/Footer/Team.jsx";
import Privacy from "./pages/Footer/Privacy.jsx";
import Contact from "./pages/Footer/Contact.jsx";
import Verify from "./pages/Footer/Verify.jsx";
import PetCare from "./pages/Footer/PetCare.jsx";
import Guidelines from "./pages/Footer/Guidelines.jsx";
import Shelters from "./pages/Footer/Shelters.jsx";
import Partner from "./pages/Footer/Partner.jsx";
import EditPet from "./pages/EditPet.jsx";

import './App.css'

import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./auth/useAuth.js"


function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-kicker">
            Paw Match
          </span>

          <h1 className="home-title">
            Helping pets find loving homes.
          </h1>

          <p className="home-subtitle">
            Browse adoptable pets, connect with shelters, and make the adoption process easier.
          </p>

          <div className="cta-row">
            <Link to="/register" className="cta">
              Get Started
            </Link>

            <Link to="/login" className="cta ghost">
              Log In
            </Link>
          </div>
        </div>
      </section>

      <div className="home-action-grid">
        <div className="grid3">
          <div className="home-action-card">
            <h3>Find Pets</h3>

            <p className="muted">
              Search pets by breed, species, age, and shelter.
            </p>
          </div>

          <div className="home-action-card">
            <h3>Connect</h3>

            <p className="muted">
              Reach out to shelters and learn more about pets.
            </p>
          </div>

          <div className="home-action-card">
            <h3>Adopt</h3>

            <p className="muted">
              Take the next step toward giving a pet a loving home.
            </p>
          </div>
        </div>
      </div>

      <section className="home-mission">
        <div>
          <span className="home-kicker">
            Our Mission
          </span>

          <h2>
            Making pet adoption easier for everyone.
          </h2>

          <p className="home-mission-text">
            Paw Match helps adopters and shelters stay organized, connected, and focused on finding the right match.
          </p>
        </div>

        <div className="home-news-card">
          <h3>Start here</h3>

          <div className="section">
            <Link to="/register" className="home-news-link">
              Create an account
            </Link>

            <Link to="/login" className="home-news-link">
              Log in
            </Link>

            <Link to="/browse-pets" className="home-news-link">
              Browse available pets
            </Link>
          </div>
        </div>
      </section>
    </main>
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
          <Route path="/edit-pet/:id" element={<RequireRole role="shelter_admin"><EditPet /></RequireRole>}/>
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/pet-care" element={<PetCare />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/shelters" element={<Shelters />} />
          <Route path="/partner" element={<Partner />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;