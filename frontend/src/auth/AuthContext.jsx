import React, { createContext, useContext, useMemo, useState } from "react";
import { clearAuth, loadAuth, saveAuth } from "./storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadAuth());

  const login = (payload) => {
    setAuth(payload);
    saveAuth(payload);
  };

  const logout = () => {
    setAuth(null);
    clearAuth();
  };

  const value = useMemo(() => {
    return {
      user: auth?.user || null,
      token: auth?.token || null,
      isAuthed: !!auth?.token,
      login,
      logout,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
