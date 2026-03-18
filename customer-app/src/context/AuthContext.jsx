import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
const API = "http://localhost:8000";

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("routex_customer"));
    } catch {
      return null;
    }
  });

  const login = async (email, phone) => {
    // Customer login — find by email in clients table
    const res = await fetch(`${API}/clients/demo-company`);
    if (!res.ok) throw new Error("Could not connect to server");
    const clients = await res.json();
    const found = clients.find(
      (c) =>
        c.email?.toLowerCase() === email.toLowerCase() || c.phone === phone,
    );
    if (!found)
      throw new Error("Account not found. Contact your logistics provider.");
    localStorage.setItem("routex_customer", JSON.stringify(found));
    setCustomer(found);
    return found;
  };

  const loginAsGuest = () => {
    const guest = { id: "guest", name: "Guest", email: "", type: "guest" };
    localStorage.setItem("routex_customer", JSON.stringify(guest));
    setCustomer(guest);
  };

  const logout = () => {
    localStorage.removeItem("routex_customer");
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ customer, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
