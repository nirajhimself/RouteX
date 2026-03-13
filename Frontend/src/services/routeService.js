import api from "../api/api";
export const routeService = {
  optimize: (data) => api.post("/optimize-route", data),
  getLocation: (routeId) => api.get(`/route/${routeId}/location`),
  updateLocation: (data) => api.post("/update-location", data),
  completeTrip: (routeId) => api.post(`/complete-trip/${routeId}`),
  predictDelay: (data) => api.post("/predict-delay", data),
};
