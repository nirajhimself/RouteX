import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
const API = "http://localhost:8000";

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("routex_driver"));
    } catch {
      return null;
    }
  });

  const login = async (name, phone) => {
    const res = await fetch(`${API}/driver/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (!res.ok)
      throw new Error("Driver not found. Check your name and phone.");
    const data = await res.json();
    localStorage.setItem("routex_driver", JSON.stringify(data));
    setDriver(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("routex_driver");
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
