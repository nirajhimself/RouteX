# RouteX Dashboard v2 — Full Modular Architecture

> Production-grade logistics SaaS · React + Vite + TailwindCSS + Framer Motion + Recharts + Leaflet

---

## ⚡ Quick Start

### Prerequisites
| Tool | Version |
|------|---------|
| **Node.js** | v18+ · https://nodejs.org |
| **VS Code** | latest · https://code.visualstudio.com |

### 1. Open in VS Code
```bash
code routex-v2
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start dev server
```bash
npm run dev
```
Opens at → **http://localhost:3000** ✅

### 4. Start FastAPI backend (optional)
```bash
uvicorn main:app --reload
```

---

## 📁 Architecture

```
src/
├── api/
│   └── api.js                  ← Axios instance (baseURL: 127.0.0.1:8000)
│
├── services/                   ← One file per entity
│   ├── driverService.js
│   ├── vehicleService.js
│   ├── shipmentService.js
│   ├── warehouseService.js
│   ├── routeService.js
│   └── inventoryService.js
│
├── context/
│   └── ThemeContext.jsx        ← Dark/light mode (persisted to localStorage)
│
├── hooks/
│   └── useFetch.js             ← Generic async fetch hook
│
├── layouts/
│   └── MainLayout.jsx          ← Sidebar + Navbar shell
│
├── components/
│   ├── Sidebar.jsx             ← Desktop fixed + mobile drawer
│   ├── Navbar.jsx              ← Search · theme toggle · alerts · clock · ticker
│   ├── StatsCard.jsx           ← Animated metric card
│   ├── Table.jsx               ← Universal table: search + filter + pagination
│   ├── Modal.jsx               ← Framer Motion modal
│   ├── MapView.jsx             ← Leaflet map (dark tiles + vehicle markers)
│   └── LiveTracker.jsx         ← Real-time fleet tracker (3s refresh)
│
└── pages/
    ├── Dashboard.jsx           ← KPIs · charts · AI alerts
    ├── Drivers.jsx             ← Driver roster + add modal
    ├── Vehicles.jsx            ← Fleet registry + register modal
    ├── Shipments.jsx           ← Shipment tracking + create modal
    ├── Warehouses.jsx          ← Warehouse grid + capacity bars
    ├── Inventory.jsx           ← Stock levels + add modal
    ├── Routes.jsx              ← AI route optimizer (POST /optimize-route)
    ├── Tracking.jsx            ← Live map tracking + activity log
    └── Analytics.jsx           ← Revenue · performance · AI delay predictor
```

---

## 🔌 API Endpoints Used

| Page | Method | Endpoint |
|------|--------|----------|
| Drivers | GET | `/drivers/{company_id}` |
| Drivers | POST | `/create-driver` |
| Vehicles | GET | `/vehicles/{company_id}` |
| Vehicles | POST | `/create-vehicle` |
| Shipments | GET | `/shipments/{company_id}` |
| Shipments | POST | `/create-shipment` |
| Warehouses | GET | `/warehouses/{company_id}` |
| Warehouses | POST | `/create-warehouse` |
| Inventory | GET | `/warehouse-inventory/{warehouse_id}` |
| Inventory | POST | `/add-inventory` |
| Routes | POST | `/optimize-route` |
| Routes | PUT | `/complete-trip/{route_id}` |
| Tracking | GET | `/route/{route_id}/location` |
| Tracking | POST | `/update-location` |
| Analytics | POST | `/predict-delay` |

> All pages fall back to rich mock data when the backend is offline.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Brand Red | `#e8001d` |
| Dark BG | `#070a0f` |
| Surface | `#0c1018` |
| Display Font | Syne |
| Body Font | Inter |
| Mono Font | JetBrains Mono |

---

## 🛠 Scripts

```bash
npm run dev       # Dev server → localhost:3000
npm run build     # Production build → ./dist
npm run preview   # Preview production build
```
