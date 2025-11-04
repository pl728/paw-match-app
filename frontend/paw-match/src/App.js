import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Greeting from './Greeting';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import React from 'react';

function App() {  

return (
  <Router>
    <div className="App">
      <Greeting />
        <header className="App-header">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
            </Routes>
        </header>
    </div>
  </Router>
  );
}

export default App;
