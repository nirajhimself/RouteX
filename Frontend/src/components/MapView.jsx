import { useEffect, useRef, useState } from "react";

const STATUS_COLOR = {
  Moving: "#e8001d",
  Active: "#e8001d",
  Parked: "#4ade80",
  Idle: "#6b7280",
  Inactive: "#6b7280",
};

function markerHTML(v) {
  const c = STATUS_COLOR[v.status] || "#94a3b8";
  const pulse = v.status === "Moving" || v.status === "Active";
  return `<div style="position:relative;width:28px;height:28px;cursor:pointer">
    ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${c};opacity:.25;animation:markerPing 2s ease-out infinite"></div>` : ""}
    <div style="position:absolute;inset:4px;border-radius:50%;background:${c};border:2px solid rgba(0,0,0,.5);box-shadow:0 0 10px ${c}70"></div>
    <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:rgba(7,10,15,.9);border:1px solid ${c}40;border-radius:4px;padding:1px 5px;white-space:nowrap;font-family:monospace;font-size:9px;color:${c};font-weight:700">${v.id || ""}</div>
  </div>`;
}

function popupHTML(v) {
  const c = STATUS_COLOR[v.status] || "#94a3b8";
  return `<div style="font-family:'Inter',monospace;background:#0c1018;padding:12px;border-radius:8px;min-width:160px;border:1px solid #1f2a3c">
    <div style="color:#e8001d;font-weight:700;font-size:12px;margin-bottom:8px">${v.id || "Vehicle"}</div>
    ${v.driver ? `<div style="color:#94a3b8;font-size:11px;margin-bottom:4px">👤 ${v.driver}</div>` : ""}
    ${v.speed != null ? `<div style="color:#94a3b8;font-size:11px;margin-bottom:4px">⚡ ${Number(v.speed).toFixed(0)} km/h</div>` : ""}
    ${v.route ? `<div style="color:#94a3b8;font-size:11px;margin-bottom:4px">🗺 ${v.route}</div>` : ""}
    ${v.lat != null ? `<div style="color:#475569;font-size:10px;font-family:monospace;margin-bottom:6px">${Number(v.lat).toFixed(4)}, ${Number(v.lng).toFixed(4)}</div>` : ""}
    <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:${c}15;color:${c};border:1px solid ${c}25;font-family:monospace">
      <span style="width:5px;height:5px;border-radius:50%;background:${c};display:inline-block"></span>${v.status}
    </span>
  </div>`;
}

// ✅ Dynamically loads Leaflet CSS + JS if not already present
function loadLeaflet() {
  return new Promise((resolve) => {
    // Already loaded
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Load CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading
      const check = setInterval(() => {
        if (window.L) {
          clearInterval(check);
          resolve(window.L);
        }
      }, 50);
    }
  });
}

export default function MapView({
  vehicles = [],
  routePoints = [],
  height = "480px",
  center = [20.5937, 78.9629],
  zoom = 5,
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef({});
  const routeLine = useRef(null);
  const [ready, setReady] = useState(false);

  // ✅ Initialize map after Leaflet loads
  useEffect(() => {
    let destroyed = false;

    loadLeaflet().then((L) => {
      if (!L || destroyed || mapRef.current || !ref.current) return;

      const map = L.map(ref.current, {
        center,
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 },
      ).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;
      if (!destroyed) setReady(true);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markers.current = {};
      }
    };
  }, []);

  // ✅ Update vehicle markers
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    const ids = new Set(vehicles.map((v) => String(v.id)));
    Object.keys(markers.current).forEach((id) => {
      if (!ids.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    vehicles.forEach((v) => {
      const lat = Number(v.lat ?? v.latitude);
      const lng = Number(v.lng ?? v.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const id = String(v.id);
      const icon = L.divIcon({
        className: "",
        html: markerHTML(v),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
      });
      if (markers.current[id]) {
        markers.current[id].setLatLng([lat, lng]);
        markers.current[id].setIcon(icon);
      } else {
        markers.current[id] = L.marker([lat, lng], { icon })
          .bindPopup(popupHTML(v), { maxWidth: 220 })
          .addTo(map);
      }
    });
  }, [vehicles, ready]);

  // ✅ Draw route polyline
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    if (routeLine.current) {
      routeLine.current.remove();
      routeLine.current = null;
    }

    if (routePoints.length >= 2) {
      routeLine.current = L.polyline(routePoints, {
        color: "#e8001d",
        weight: 3,
        opacity: 0.7,
        dashArray: "8 5",
      }).addTo(map);
      map.fitBounds(routeLine.current.getBounds(), { padding: [40, 40] });
    }
  }, [routePoints, ready]);

  return (
    <div
      style={{ height, position: "relative" }}
      className="rounded-xl overflow-hidden border border-dark-500 dark:border-dark-500 light:border-slate-200"
    >
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
      {!ready && (
        <div className="absolute inset-0 bg-dark-900 flex items-center justify-center">
          <span className="flex items-center gap-2 font-mono text-xs text-slate-500 animate-pulse">
            <span className="w-3 h-3 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            Loading map…
          </span>
        </div>
      )}
    </div>
  );
}
