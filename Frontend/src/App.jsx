import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Shipments from "./pages/Shipments";
import Warehouses from "./pages/Warehouses";
import Inventory from "./pages/Inventory";
import RoutesPage from "./pages/Routes";
import Tracking from "./pages/Tracking";
import Analytics from "./pages/Analytics";
import DriverApp from "./pages/DriverApp";
import Booking from "./pages/Booking";
import TrackingPortal from "./pages/TrackingPortal";
import BookingsPage from "./pages/BookingsPage";
import Notifications from "./pages/Notifications";
import Negotiation from "./pages/Negotiation";
import HeatMap from "./pages/HeatMap";
import Invoices from "./components/Invoices";
import InvoiceGenerator from "./pages/InvoiceGenerator";
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/shipments" element={<Shipments />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/driver" element={<DriverApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/track" element={<TrackingPortal />} />
        <Route path="/track/:id" element={<TrackingPortal />} />
        <Route path="/bookings-list" element={<BookingsPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/negotiation" element={<Negotiation />} />
        <Route path="/heatmap" element={<HeatMap />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
      </Route>
    </Routes>
  );
}
