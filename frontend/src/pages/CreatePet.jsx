import React from "react";
import { Link } from "react-router-dom";

function CreatePet() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Create a Pet</h1>
      <p>This is where your pet creation form will go.</p>

      <form>
        <div>
          <label htmlFor="name">Pet Name:</label>
          <input type="text" id="name" name="name" />
        </div>
        <div>
          <label htmlFor="type">Pet Type:</label>
          <input type="text" id="type" name="type" />
        </div>
        <div>
          <label htmlFor="age">Pet Age:</label>
          <input type="number" id="age" name="age" />
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
