// RouteX - geocode.js
// Free geocoding via OpenStreetMap Nominatim + routing via OSRM
// No API key needed

const geocodeCache = {};
const routeCache = {};

// ─── Geocode a city name to [lat, lng] ───────────────────────────────────────
export async function geocodeCity(cityName) {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  if (geocodeCache[key]) return geocodeCache[key];
  try {
    const query = encodeURIComponent(cityName + ", India");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "RouteX-Logistics-App",
        },
      },
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[key] = coords;
      return coords;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Search suggestions as user types ────────────────────────────────────────
export async function searchPlaces(query) {
  if (!query || query.length < 2) return [];
  try {
    const encoded = encodeURIComponent(query + ", India");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1&countrycodes=in`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "RouteX-Logistics-App",
        },
      },
    );
    const data = await res.json();
    return data.map((item) => ({
      name: item.display_name.split(",").slice(0, 3).join(",").trim(),
      full: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
    }));
  } catch {
    return [];
  }
}

// ─── Get a single road route (A → B) ─────────────────────────────────────────
export async function getRoadRoute(originCoords, destCoords) {
  const cacheKey = `${originCoords}-${destCoords}`;
  if (routeCache[cacheKey]) return routeCache[cacheKey];
  try {
    const [lat1, lon1] = originCoords;
    const [lat2, lon2] = destCoords;
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes.length > 0) {
      const points = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
      const result = {
        points,
        distance: (data.routes[0].distance / 1000).toFixed(0) + " km",
        duration:
          Math.round(data.routes[0].duration / 3600) +
          " hrs " +
          Math.round((data.routes[0].duration % 3600) / 60) +
          " min",
        raw_distance: data.routes[0].distance,
        raw_duration: data.routes[0].duration,
      };
      routeCache[cacheKey] = result;
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Get MULTIPLE route alternatives (fastest / cheapest / eco) ───────────────
// Used by Routes.jsx route optimization page
export async function getMultipleRoutes(originCoords, destCoords) {
  const cacheKey = `multi-${originCoords}-${destCoords}`;
  if (routeCache[cacheKey]) return routeCache[cacheKey];

  try {
    const [lat1, lon1] = originCoords;
    const [lat2, lon2] = destCoords;

    // Request up to 3 alternatives from OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&alternatives=3`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) return null;

    // Cost constants for heavy truck
    const fuelPerKm = 0.28; // liters per km
    const fuelPrice = 100; // ₹ per liter diesel
    const tollPerKm = 1.5; // ₹ per km toll estimate
    const co2PerLtr = 2.68; // kg CO2 per liter diesel

    const processed = data.routes.map((route, i) => {
      const distKm = route.distance / 1000;
      const durMin = route.duration / 60;
      const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const fuelCost = Math.round(distKm * fuelPerKm * fuelPrice);
      const tollCost = Math.round(distKm * tollPerKm);
      const totalCost = fuelCost + tollCost;
      const co2Kg = Math.round(distKm * fuelPerKm * co2PerLtr);
      return {
        index: i,
        points,
        distanceKm: distKm.toFixed(0),
        durationMin: Math.round(durMin),
        durationText: `${Math.floor(durMin / 60)}h ${Math.round(durMin % 60)}m`,
        fuelCost,
        tollCost,
        totalCost,
        co2Kg,
        raw_distance: route.distance,
        raw_duration: route.duration,
      };
    });

    const byTime = [...processed].sort(
      (a, b) => a.raw_duration - b.raw_duration,
    );
    const byDist = [...processed].sort(
      (a, b) => a.raw_distance - b.raw_distance,
    );

    const fastest = byTime[0];
    const cheapest =
      byDist[0].index !== fastest.index
        ? byDist[0]
        : byDist[1] || byTime[1] || byTime[0];
    const eco =
      processed.find(
        (r) => r.index !== fastest.index && r.index !== cheapest.index,
      ) || cheapest;

    const result = {
      fastest: {
        ...fastest,
        label: "Fastest",
        color: "#60a5fa",
        icon: "⚡",
        desc: "Shortest travel time",
      },
      cheapest: {
        ...cheapest,
        label: "Cheapest",
        color: "#4ade80",
        icon: "💰",
        desc: "Lowest fuel & toll cost",
      },
      eco: {
        ...eco,
        label: "Eco",
        color: "#a3e635",
        icon: "🌿",
        desc: "Lowest CO₂ emissions",
      },
      all: processed,
    };

    routeCache[cacheKey] = result;
    return result;
  } catch {
    return null;
  }
}
