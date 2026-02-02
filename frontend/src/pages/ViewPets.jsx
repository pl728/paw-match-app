import React from "react";
import { Link } from "react-router-dom";


function ViewPets() {
    // Functionality and UI for viewing all pets will be added here 
    // Will integrate DB data using CRUD operations for fetch API 
    return (
        <div style={{ padding: "2rem" }}> 
            <h1>View Pets</h1>
            <p> (coming soon) </p>
            <Link to="/"><button>Home</button></Link>
        </div>
        
    );  
}

export default ViewPets;