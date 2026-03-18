import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MyTrips from "./pages/MyTrips";
import ActiveTrip from "./pages/ActiveTrip";
import Earnings from "./pages/Earnings";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";
import "./index.css";

function ProtectedLayout() {
  const { driver } = useAuth();
  if (!driver) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<MyTrips />} />
          <Route path="/trip/:id" element={<ActiveTrip />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const { driver } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={driver ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
