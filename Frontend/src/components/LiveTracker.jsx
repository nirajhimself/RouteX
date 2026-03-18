import { useState, useEffect, useCallback } from "react";
import MapView from "./MapView";
import api from "../api/api";
import { COMPANY_ID, POLL_INTERVAL_MS } from "../config";

// Real Indian city coordinates fallback
const CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  delhi: [28.7041, 77.1025],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.385, 78.4867],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  surat: [21.1702, 72.8311],
  nagpur: [21.1458, 79.0882],
  indore: [22.7196, 75.8577],
  noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266],
  chandigarh: [30.7333, 76.7794],
  kochi: [9.9312, 76.2673],
  bhopal: [23.2599, 77.4126],
};

function getCityCoords(cityStr) {
  if (!cityStr) return null;
  const key = cityStr.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city) || city.includes(key)) {
      // Add slight jitter so vehicles don't stack on same point
      return [
        coords[0] + (Math.random() - 0.5) * 0.05,
        coords[1] + (Math.random() - 0.5) * 0.05,
      ];
    }
  }
  return null;
}

export default function LiveTracker() {
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        api.get(`/live-vehicles/${COMPANY_ID}`),
        api.get(`/shipments/${COMPANY_ID}`),
      ]);

      const vehicleList = Array.isArray(vRes.data) ? vRes.data : [];
      const shipmentList = Array.isArray(sRes.data) ? sRes.data : [];

      setShipments(shipmentList);

      // Enrich vehicles with fallback coordinates from their shipments
      const enriched = vehicleList.map((v, idx) => {
        // Already has real GPS — use it
        if (v.lat && v.lng) return { ...v, coordSource: "gps" };

        // Find an active shipment assigned to this vehicle (by index as fallback)
        const activeShipment = shipmentList.find(
          (s) => s.driver_id && ["Pending", "In Transit"].includes(s.status),
        );

        // Try pickup city first, then delivery city
        let fallbackCoords = null;
        if (activeShipment) {
          fallbackCoords =
            getCityCoords(activeShipment.pickup_location) ||
            getCityCoords(activeShipment.delivery_location);
        }

        // If still nothing, use vehicle index to spread across major cities
        if (!fallbackCoords) {
          const defaultCities = [
            [19.076, 72.8777], // Mumbai
            [28.7041, 77.1025], // Delhi
            [12.9716, 77.5946], // Bangalore
            [17.385, 78.4867], // Hyderabad
            [13.0827, 80.2707], // Chennai
          ];
          fallbackCoords = defaultCities[idx % defaultCities.length];
          fallbackCoords = [
            fallbackCoords[0] + (Math.random() - 0.5) * 0.1,
            fallbackCoords[1] + (Math.random() - 0.5) * 0.1,
          ];
        }

        return {
          ...v,
          lat: fallbackCoords[0],
          lng: fallbackCoords[1],
          speed: 0,
          coordSource: "estimated",
        };
      });

      setVehicles(enriched);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadData]);

  // All vehicles now have coords (real GPS or estimated)
  const mappedVehicles = vehicles.filter((v) => v.lat && v.lng);
  const activeCount = mappedVehicles.length;
  const movingCount = vehicles.filter((v) => v.status === "Moving").length;
  const gpsCount = vehicles.filter((v) => v.coordSource === "gps").length;

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
                      : v.coordSource === "gps"
                        ? "bg-emerald-400"
                        : "bg-yellow-500"
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
                {v.coordSource === "gps" ? (
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
                  <>
                    <p className="font-mono text-[10px] text-yellow-500">
                      Est. location
                    </p>
                    <p className="font-mono text-[9px] text-slate-600">
                      {v.lat?.toFixed(3)}, {v.lng?.toFixed(3)}
                    </p>
                  </>
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

        {/* Legend */}
        {vehicles.length > 0 && (
          <div className="flex items-center gap-4 mb-3 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
              <span className="text-[10px] text-slate-500 font-mono">
                Live GPS ({gpsCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 block" />
              <span className="text-[10px] text-slate-500 font-mono">
                Estimated ({activeCount - gpsCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse block" />
              <span className="text-[10px] text-slate-500 font-mono">
                Moving ({movingCount})
              </span>
            </div>
          </div>
        )}

        {mappedVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border border-dark-600 rounded-xl">
            <p className="text-slate-500 text-sm mb-2">No vehicles found</p>
            <p className="text-slate-600 text-xs font-mono text-center px-4">
              Add vehicles from the Vehicles page first
            </p>
          </div>
        ) : (
          <MapView
            vehicles={mappedVehicles}
            height="400px"
            zoom={5}
            center={[20.5937, 78.9629]}
          />
        )}

        {/* Info note */}
        {vehicles.length > 0 && gpsCount < vehicles.length && (
          <p className="text-[10px] text-slate-600 font-mono mt-2 text-center">
            Yellow pins = estimated position based on shipment city. Open driver
            app on phone to enable live GPS.
          </p>
        )}
      </div>
    </div>
  );
}
