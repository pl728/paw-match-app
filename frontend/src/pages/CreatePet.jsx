import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { createPet } from "../services/pets.js";



// References: https://react.dev/reference/react-dom/components/select
// Returns the form to create a new pet
function CreatePet() {
  // Navigates the user to diff page after submission  
  const navigate = useNavigate();

  // Stores the form data for the pet to be created
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    size: "small"
  }); 

  // Handles the change in form data with user input
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  }
  // Handles the form submission when event occurs
  async function handleSubmit(e) {
    console.log(formData);
    e.preventDefault();
    
    try {
      await createPet(formData);
      navigate('/view-pets');  
    } catch (err) {
      alert(`Error creating pet: ${err.message}`);
    }
  }
   

  // Form to create pet
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
          <input name = "species" value={formData.species} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="breed">Breed:</label>
          <input name="breed" value={formData.breed} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="age_years">Age:</label>
          <input placeholder="Age (in years)" name="age_years" value={formData.age_years} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="sex">Sex:</label>
          <input type="text" id="sex" name="sex" value={formData.sex} onChange={handleChange} />
        </div>
          <label>Size:
            <select name="size" value={formData.size} onChange={handleChange}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
            <button type="submit">Create Pet</button>
        </form>
      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}

export default CreatePet;
