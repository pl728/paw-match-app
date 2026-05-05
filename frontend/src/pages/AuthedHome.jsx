import React from "react";
import { useAuth } from "../auth/useAuth.js";

function AuthedHome() {
  const { user } = useAuth();

  return (
    <div className="page center">
      <h1>Welcome back, {user?.username || "user"}</h1>
      <p className="muted">Glad to see you again 🐾</p>
    </div>
  );
}

export default AuthedHome;