import { useState, useEffect, useCallback } from "react";
import MapView from "./MapView";
import api from "../api/api";
import { COMPANY_ID, POLL_INTERVAL_MS } from "../config";

export default function LiveTracker() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadVehicles = useCallback(async () => {
    try {
      const res = await api.get(`/live-vehicles/${COMPANY_ID}`);
      const list = Array.isArray(res.data) ? res.data : [];

      // Only pass vehicles that have GPS coordinates to the map
      setVehicles(list);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      // silently fail — don't crash the page
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    const id = setInterval(loadVehicles, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadVehicles]);

  // Only vehicles with GPS location for the map
  const mappedVehicles = vehicles.filter((v) => v.lat && v.lng);
  const activeCount = mappedVehicles.length;
  const movingCount = vehicles.filter((v) => v.status === "Moving").length;

  return (
    <div className="space-y-3">
      {/* Vehicle list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-3 card p-4 text-center">
            <p className="text-xs text-slate-500 font-mono animate-pulse">
              Loading vehicles…
            </p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="col-span-3 card p-6 text-center">
            <p className="text-slate-500 text-sm">No vehicles found.</p>
            <p className="text-slate-600 text-xs font-mono mt-1">
              Add vehicles first from the Vehicles page.
            </p>
          </div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="card p-4 flex items-center gap-3">
              {/* Status dot */}
              <div className="flex-shrink-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full block ${
                    v.status === "Moving"
                      ? "bg-brand-red animate-pulse"
                      : v.has_location
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold text-brand-red truncate">
                  {v.id}
                </p>
                <p className="text-[10px] text-slate-500">
                  {v.vehicle_type || "Vehicle"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {v.has_location ? (
                  <>
                    <p
                      className="font-mono text-xs font-bold"
                      style={{
                        color: v.status === "Moving" ? "#e8001d" : "#4ade80",
                      }}
                    >
                      {v.speed > 0 ? `${v.speed} km/h` : "Stopped"}
                    </p>
                    <p className="font-mono text-[9px] text-slate-600">
                      {v.lat?.toFixed(3)}, {v.lng?.toFixed(3)}
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-[10px] text-slate-600">
                    No GPS yet
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live map */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "Syne,sans-serif" }}
            >
              Live Map
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="font-mono text-[10px] text-slate-600">
                Updated {lastRefresh}
              </span>
            )}
            <span className="font-mono text-[10px] text-emerald-400">
              {activeCount} on map · {movingCount} moving
            </span>
          </div>
        </div>

        {mappedVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border border-dark-600 rounded-xl">
            <p className="text-slate-500 text-sm mb-2">
              No vehicles on map yet
            </p>
            <p className="text-slate-600 text-xs font-mono text-center px-4">
              Drivers need to open
              <br />
              <span className="text-brand-red">localhost:3000/driver</span>
              <br />
              on their phone to start sending GPS
            </p>
          </div>
        ) : (
          <MapView
            vehicles={mappedVehicles}
            height="400px"
            zoom={6}
            center={[mappedVehicles[0].lat, mappedVehicles[0].lng]}
          />
        )}
      </div>
    </div>
  );
}
