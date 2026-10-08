import { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredUser, getToken, setSession, clearSession } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Validate the stored token on load.
    if (!getToken()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await api.login({ email, password });
    setSession(u, token);
    setUser(u);
  };

  const register = async (name, email, password, passwordConfirmation) => {
    const { user: u, token } = await api.register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    setSession(u, token);
    setUser(u);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* token may already be invalid */
    }
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
