import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
    return (
      <>
        <h1>Home</h1>
        <Link className = "App-link" to="/Login"> Login</Link>
      </>
    );
}

export default HomePage;