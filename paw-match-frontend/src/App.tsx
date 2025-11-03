import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/animal/:id" element={<AnimalDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
