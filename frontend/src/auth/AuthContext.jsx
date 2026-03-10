import React, { useMemo, useState } from "react";
import { AuthContext } from "./context.js";
import { clearAuth, loadAuth, saveAuth } from "./storage.js";

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
