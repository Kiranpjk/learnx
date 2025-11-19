import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Auto-login on refresh
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    axios
      .get("http://127.0.0.1:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  // LOGIN FUNCTION
  const login = async (username, password) => {
    const res = await axios.post("http://127.0.0.1:8000/api/auth/token/", {
      username,
      password,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    const me = await axios.get("http://127.0.0.1:8000/api/auth/me/", {
      headers: { Authorization: `Bearer ${res.data.access}` },
    });

    setUser(me.data);
  };

  // LOGOUT FUNCTION
  const logout = async () => {
    const refresh = localStorage.getItem("refresh");

    await axios.post("http://127.0.0.1:8000/api/auth/logout/", { refresh });

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
