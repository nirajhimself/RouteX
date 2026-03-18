import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Track from "./pages/Track";
import MyOrders from "./pages/MyOrders";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import BookOrder from "./pages/BookOrder";
import "./index.css";

function Layout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/track" element={<Track />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/book" element={<BookOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
