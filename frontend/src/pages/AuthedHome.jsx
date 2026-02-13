import React from "react";
import { useAuth } from "../auth/AuthContext.jsx";

function AuthedHome() {
  const { user } = useAuth();

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '48px 20px',
      textAlign: 'center'
    }}>
      <h1>Welcome back, {user?.username || "user"}</h1>
    </div>
  );
}

export default AuthedHome;
