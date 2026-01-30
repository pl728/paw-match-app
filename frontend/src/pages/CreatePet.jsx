import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";



// References: https://react.dev/reference/react-dom/components/select
// Returns the form to create a new pet
function CreatePet() {
  // Navigates the user to diff page after submission  
  const navigate = useNavigate();
  // Store all pet data 
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    sex: "",
    size: "small",
  }); 

  // Handles the form submission when event occurs
  async function handleSubmit(e) {
    e.preventDefault();
    
    const response = await fetch('/api/pets', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    // navigate to main view pets page after successful form submission
    if (response.ok) {
      navigate('/view-pets');  
    }
  }
   
  function handleChange(e) {
    const { name, value } = e.target;
  }
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Create a Pet</h1>
      <p>Please submit details about this pet to add to the shelter database.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Pet Name:</label>
          <input name = "name" onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="species">Species:</label>
          <input name = "species" onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="breed">Breed:</label>
          <input name="breed" onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="age">Age:</label>
          <input placeholder="Age (in years)" name="age" onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="sex">Sex:</label>
          <input type="text" id="sex" name="sex" onChange={handleChange} />
        </div>
        <form>
         
          <label>Size:
            <select name="size" onChange={handleChange}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </form>
        
        <Link to="/view-pets"><button type="submit">Create Pet</button></Link>
      </form>

      <p>
        <Link to="/"><button>Home</button></Link>
      </p>
    </div>
  );
}

export default CreatePet;
