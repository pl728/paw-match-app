import React, { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import pawmatchlogo from './assets/pawmatch_logo.png'
import CreatePet from './CreatePet.jsx' 
import './App.css'
import { Link, Routes, Route, BrowserRouter } from "react-router-dom"

// References: 
// https://www.geeksforgeeks.org/reactjs/reactjs-components
// https://dev.to/techcheck/creating-a-react-node-and-express-app-1ieg

// Home page component

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <header>
          <img src={pawmatchlogo} className="logo" alt="Pawmatch logo"/>
        </header>
      </div>
      <h1>Welcome!</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <p>
          <Link to="/create-pet">Create Pet</Link>
          <p></p>
          <Link to="/view-pets">View Pets</Link> 
        </p>
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
    </Routes>
  );
}
export default App
