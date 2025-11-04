import React from 'react';
import { Link } from 'react-router-dom';

function Login() {
    return (
        <>
            <h1>Login</h1>
            <Link className = "App-link" to="/"> Back to Home</Link>
        </>
    );
}

export default Login;