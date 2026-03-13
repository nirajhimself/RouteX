import { useState, useEffect, useRef } from "react";
import api from "../api/api";

const STATUS_COLOR = {
  Pending: { bg: "#fbbf2415", border: "#fbbf2430", text: "#fbbf24" },
  "In Transit": { bg: "#60a5fa15", border: "#60a5fa30", text: "#60a5fa" },
  Delivered: { bg: "#4ade8015", border: "#4ade8030", text: "#4ade80" },
  Delayed: { bg: "#f8717115", border: "#f8717130", text: "#f87171" },
};

// ─────────────────────────────────────────
// SCREEN 1 — Driver Login
// ─────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!form.name || !form.phone) {
      setError("Enter your name and phone");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/driver/login", form);
      onLogin(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Login failed. Check your name and phone.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Route<span style={{ color: "#e8001d" }}>X</span>
          </h1>
          <p className="text-slate-500 text-xs font-mono">// Driver Portal</p>
        </div>
        <div className="card p-6 space-y-4">
          <div>
            <h2
              className="text-base font-semibold mb-1"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Driver Login
            </h2>
            <p className="text-slate-500 text-xs font-mono">
              Sign in to see your deliveries
            </p>
          </div>
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="label">Your Name</label>
            <input
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input
              placeholder="e.g. 9876543210"
              value={form.phone}
              type="tel"
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="input"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN 2 — My Deliveries list
// ─────────────────────────────────────────
function DeliveriesScreen({ driver, onSelect, onLogout }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/driver/${driver.id}/shipments`);
      setShipments(Array.isArray(res.data) ? res.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = shipments.filter((s) => s.status === "Pending").length;
  const transit = shipments.filter((s) => s.status === "In Transit").length;
  const delivered = shipments.filter((s) => s.status === "Delivered").length;

  return (
    <div className="min-h-screen bg-dark-950 p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Route<span style={{ color: "#e8001d" }}>X</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono">👋 {driver.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-slate-500 border border-dark-500 px-3 py-1.5 rounded-lg hover:text-slate-300 transition-all"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          ["Pending", pending, "#fbbf24"],
          ["In Transit", transit, "#60a5fa"],
          ["Delivered", delivered, "#4ade80"],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-3 text-center">
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "Syne, sans-serif", color: c }}
            >
              {v}
            </p>
            <p className="text-[10px] text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          My Deliveries
        </h2>
        <button
          onClick={load}
          className="text-[10px] text-slate-600 font-mono hover:text-slate-400"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-slate-500 text-sm font-mono animate-pulse">
            Loading deliveries…
          </span>
        </div>
      ) : shipments.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 text-sm">No deliveries assigned yet.</p>
          <p className="text-slate-600 text-xs font-mono mt-1">
            Your manager will assign shipments to you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => {
            const sc = STATUS_COLOR[s.status] || STATUS_COLOR["Pending"];
            const canAct = s.status === "Pending" || s.status === "In Transit";
            return (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-brand-red font-bold mb-1">
                      #{s.id}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-300 truncate">
                        {s.pickup_location}
                      </span>
                      <span className="text-slate-600 flex-shrink-0">→</span>
                      <span className="text-slate-300 truncate">
                        {s.delivery_location}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">
                      {s.weight} kg
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{
                      color: sc.text,
                      background: sc.bg,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
                {canAct && (
                  <button
                    onClick={() => onSelect(s)}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-brand-red/10 border border-brand-red/25 text-brand-red hover:bg-brand-red/20 transition-all"
                  >
                    {s.status === "Pending"
                      ? "▶ Start Delivery"
                      : "📦 Continue Delivery"}
                  </button>
                )}
                {s.status === "Delivered" && (
                  <p className="text-center text-[10px] text-emerald-400 font-mono mt-1">
                    {s.has_proof ? "✓ Proof uploaded" : "✓ Delivered"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN 3 — Active Delivery + GPS
// ─────────────────────────────────────────
function ActiveDeliveryScreen({ shipment, driver, onDone, onBack }) {
  const [status, setStatus] = useState(shipment.status);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [coords, setCoords] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    startGPS();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startGPS = () => {
    if (!navigator.geolocation) return;
    setGpsStatus("active");
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          api
            .post("/update-location", {
              vehicle_id: `DRIVER-${driver.id}`,
              latitude,
              longitude,
              speed: speed ? (speed * 3.6).toFixed(0) : 0,
            })
            .catch(() => {});
        },
        () => setGpsStatus("error"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }, 10000);
  };

  const handleMarkInTransit = async () => {
    setUpdating(true);
    try {
      await api.patch(`/shipment/${shipment.id}/status`, {
        status: "In Transit",
      });
      setStatus("In Transit");
    } catch {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ FIXED: GPS origin + geocoded destination + dir_action=navigate
  const openMaps = async () => {
    setNavLoading(true);

    // Step 1 — geocode the delivery location to exact lat/lng
    const geocodeDest = async (locationName) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName + ", India")}&format=json&limit=1`,
          {
            headers: { "Accept-Language": "en", "User-Agent": "RouteX-Driver" },
          },
        );
        const data = await res.json();
        if (data.length > 0)
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        return null;
      } catch {
        return null;
      }
    };

    // Step 2 — get driver's current GPS position
    const getPosition = () =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        }),
      );

    try {
      // Run both in parallel for speed
      const [position, destCoords] = await Promise.all([
        getPosition(),
        geocodeDest(shipment.delivery_location),
      ]);

      const { latitude, longitude } = position.coords;

      let mapsUrl;
      if (destCoords) {
        // ✅ BEST: exact lat/lng for both origin and destination
        // dir_action=navigate skips route picker → opens turn-by-turn immediately on fastest route
        mapsUrl =
          `https://www.google.com/maps/dir/?api=1` +
          `&origin=${latitude},${longitude}` +
          `&destination=${destCoords.lat},${destCoords.lng}` +
          `&travelmode=driving` +
          `&dir_action=navigate`;
      } else {
        // Fallback: GPS origin + location name destination
        mapsUrl =
          `https://www.google.com/maps/dir/?api=1` +
          `&origin=${latitude},${longitude}` +
          `&destination=${encodeURIComponent(shipment.delivery_location)}` +
          `&travelmode=driving` +
          `&dir_action=navigate`;
      }

      window.open(mapsUrl, "_blank");
    } catch {
      // Final fallback: if GPS denied, just open destination search
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&destination=${encodeURIComponent(shipment.delivery_location)}` +
        `&travelmode=driving`;
      window.open(mapsUrl, "_blank");
    } finally {
      setNavLoading(false);
    }
  };

  if (showProof)
    return (
      <ProofScreen
        shipment={shipment}
        onDone={onDone}
        onBack={() => setShowProof(false)}
      />
    );

  return (
    <div className="min-h-screen bg-dark-950 p-4">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-300 text-lg"
        >
          ←
        </button>
        <div>
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Active Delivery
          </h2>
          <p className="font-mono text-[10px] text-slate-600">
            Shipment #{shipment.id}
          </p>
        </div>
      </div>

      {/* Route card */}
      <div className="card p-5 mb-4">
        <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mb-3">
          Route
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-red/20 border border-brand-red/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-brand-red">A</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-mono">PICKUP</p>
              <p className="text-sm font-semibold">
                {shipment.pickup_location}
              </p>
            </div>
          </div>
          <div className="ml-3 border-l-2 border-dashed border-dark-500 h-4" />
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-emerald-400">B</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-mono">DELIVERY</p>
              <p className="text-sm font-semibold">
                {shipment.delivery_location}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-700 flex justify-between items-center">
          <span className="text-xs text-slate-500">{shipment.weight} kg</span>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{
              color: (STATUS_COLOR[status] || STATUS_COLOR["Pending"]).text,
              background: (STATUS_COLOR[status] || STATUS_COLOR["Pending"]).bg,
              border: `1px solid ${(STATUS_COLOR[status] || STATUS_COLOR["Pending"]).border}`,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* GPS status bar */}
      <div className="card p-3 mb-4 flex items-center gap-3">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            gpsStatus === "active"
              ? "bg-emerald-400 animate-pulse"
              : gpsStatus === "error"
                ? "bg-red-400"
                : "bg-slate-600"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">
            {gpsStatus === "active"
              ? "GPS Active — sending location"
              : gpsStatus === "error"
                ? "GPS Error — allow location access"
                : "GPS Starting…"}
          </p>
          {coords && (
            <p className="font-mono text-[10px] text-slate-600">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* ✅ Navigate button - now uses GPS + geocoded exact coords */}
        <button
          onClick={openMaps}
          disabled={navLoading}
          className="w-full py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {navLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              Getting your location…
            </>
          ) : (
            <>🗺️ Navigate to Destination</>
          )}
        </button>

        {status === "Pending" && (
          <button
            onClick={handleMarkInTransit}
            disabled={updating}
            className="w-full py-3 rounded-xl border border-brand-red/30 bg-brand-red/10 text-brand-red text-sm font-semibold hover:bg-brand-red/20 transition-all disabled:opacity-60"
          >
            {updating ? "Updating…" : "▶ Mark as In Transit"}
          </button>
        )}

        {status === "In Transit" && (
          <button
            onClick={() => setShowProof(true)}
            className="btn-primary w-full justify-center py-3"
          >
            📸 Upload Proof & Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN 4 — Upload Proof (Photo)
// ─────────────────────────────────────────
function ProofScreen({ shipment, onDone, onBack }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!photo) {
      alert("Take a photo first");
      return;
    }
    setUploading(true);
    try {
      await api.post(`/shipment/${shipment.id}/proof`, { photo });
      setDone(true);
    } catch (err) {
      alert(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (done)
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <h2
            className="text-lg font-bold text-emerald-400"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Delivery Complete!
          </h2>
          <p className="text-slate-500 text-sm">
            Shipment #{shipment.id} marked as Delivered
          </p>
          <button
            onClick={onDone}
            className="btn-primary justify-center px-8 py-3"
          >
            Back to My Deliveries
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-dark-950 p-4">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-300 text-lg"
        >
          ←
        </button>
        <div>
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Upload Delivery Proof
          </h2>
          <p className="font-mono text-[10px] text-slate-600">
            Shipment #{shipment.id}
          </p>
        </div>
      </div>
      <div className="card p-5 space-y-4">
        <p className="text-xs text-slate-400">
          Take a photo of the delivered package to confirm delivery.
        </p>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-dark-500 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-red/40 transition-all overflow-hidden"
          style={{ minHeight: 200 }}
        >
          {photo ? (
            <img
              src={photo}
              alt="proof"
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-slate-500">Tap to take photo</p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">
                or choose from gallery
              </p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhoto}
        />
        {photo && (
          <button
            onClick={() => setPhoto(null)}
            className="w-full py-2 text-xs text-slate-500 border border-dark-500 rounded-lg hover:text-slate-300 transition-all"
          >
            Retake Photo
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={!photo || uploading}
          className="btn-primary w-full justify-center py-3 disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading…
            </span>
          ) : (
            "✓ Confirm Delivery"
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN — screen orchestrator
// ─────────────────────────────────────────
export default function DriverApp() {
  const [screen, setScreen] = useState("login");
  const [driver, setDriver] = useState(null);
  const [activeShipment, setActiveShipment] = useState(null);

  if (screen === "login")
    return (
      <LoginScreen
        onLogin={(d) => {
          setDriver(d);
          setScreen("deliveries");
        }}
      />
    );

  if (screen === "deliveries")
    return (
      <DeliveriesScreen
        driver={driver}
        onSelect={(s) => {
          setActiveShipment(s);
          setScreen("active");
        }}
        onLogout={() => {
          setDriver(null);
          setScreen("login");
        }}
      />
    );

  if (screen === "active")
    return (
      <ActiveDeliveryScreen
        shipment={activeShipment}
        driver={driver}
        onBack={() => setScreen("deliveries")}
        onDone={() => setScreen("deliveries")}
      />
    );

  return null;
}
