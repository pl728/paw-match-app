import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UserLogin from "./pages/UserLogin";
import CreatePet from "./pages/CreatePet";
import "./App.css";

function App() {
  return (
    <div className = "App">
      <Routes>
        <Route path = "/" element = {<Home />} />
        <Route path = "/login" element = {<UserLogin />} />
        <Route path = "/createpet" element = {<CreatePet />} />
      </Routes>
    </div>
  );
}

export default App;
