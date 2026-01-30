import React from "react";
import { Link } from "react-router-dom";

// References: https://react.dev/reference/react-dom/components/select
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
          <label htmlFor="species">Species:</label>
          <input type="text" id="species" name="species" />
        </div>
        <div>
          <label htmlFor="breed">Breed:</label>
          <input type="text" id="breed" name="breed" />
        </div>
        <div>
          <label htmlFor="age">Age:</label>
          <input type="number" placeholder="Age (in years)" name="age" />
        </div>
        <div>
          <label htmlFor="sex">Sex:</label>
          <input type="text" id="sex" name="sex" />
        </div>
        <form>
         
          <label>Size:
            <select name="size" id="size">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </form>
        
        <button type="submit">Create Pet</button>
      </form>

      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}

export default CreatePet;
