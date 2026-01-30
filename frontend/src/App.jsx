import React, { useState } from 'react'
import pawmatchlogo from './assets/pawmatch_logo.png'
import CreatePet from './pages/CreatePet.jsx' 
import ViewPets from './pages/ViewPets.jsx'
import UserLogin from './pages/UserLogin.jsx'
import FeedPage from './pages/FeedPage.jsx'
import './App.css'
import { Link, Routes, Route, BrowserRouter } from "react-router-dom"

// References: 
// https://www.geeksforgeeks.org/reactjs/reactjs-components
// https://dev.to/techcheck/creating-a-react-node-and-express-app-1ieg

// Home page component

function Home() {

  return (
    <>
      <div>
        <header>
          <img src={pawmatchlogo} className="logo" alt="Pawmatch logo"/>
        </header>
      </div>
      <h1>Welcome!</h1>

      <div className="card">
        <div className="home-links">
          <Link to="/create-pet">Create a Pet</Link>
          <Link to="/view-pets">View Pets</Link>
          <Link to="/user-login">Login</Link>
          <Link to="/feed">Feed Page</Link>
        </div>
      </div>
    </>
  )
}

// Main App component with routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create-pet" element={<CreatePet />} />
      <Route path="/view-pets" element={<ViewPets />} />
      <Route path="/user-login" element={<UserLogin />} />
      <Route path="/feed" element={<FeedPage />} />
    </Routes>
  );
}
export default App
