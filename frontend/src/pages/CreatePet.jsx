import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";



// References: https://react.dev/reference/react-dom/components/select
// Returns the form to create a new pet
function CreatePet() {
  // Navigates the user to diff page after submission  
  const navigate = useNavigate();

  // Stores the list of shelters to populate the dropdown menu
  const [shelters, setShelters] = useState([]);
  // Stores the form data for the pet to be created
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    sex: "",
    size: "small",
    shelter_id: ""
  }); 

  // Fetches the list of shelters from the backend to populate the dropdown menu
  useEffect(() => {
    // Temporarily hardcoding shelters until we implement shelter creation and fetching
    setShelters([
      { id: "269702b5-04b8-11f1-bb9a-66a9427986d5", name: "Happy Tails Shelter" }
    ]);
    //async function fetchShelters() {
      //const response = await fetch("/shelters");
      //const data = await response.json();
      //setShelters(data);
    //}
    //fetchShelters();
  }, []);

  // Handles the change in form data with user input
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  }
  // Handles the form submission when event occurs
  async function handleSubmit(e) {
    console.log(formData);
    e.preventDefault();
    
    const response = await fetch('/pets', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    // navigate to main view pets page after successful form submission
    if (response.ok) {
      navigate('/view-pets');  
    } else {
      const errorData = await response.json();
      alert(`Error creating pet: ${errorData.error}`);
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
        <div>
          <label htmlFor="shelter">Select Your Shelter:</label>
          <select
            name="shelter_id"
            value={formData.shelter_id}
            onChange={(e) =>
              setFormData({...formData, shelter_id: e.target.value})
            }
          >
            <option value="">--Select Your Shelter:--</option>
            {shelters.map((shelter) => (
              <option key={shelter.id} value={shelter.id}>
                {shelter.name}
              </option>
            ))}
          </select>
        </div>
            <button type="submit">Create Pet</button>
        </form>
      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}

export default CreatePet;
