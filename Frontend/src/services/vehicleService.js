import api from '../api/api'
export const vehicleService = {
  getAll: (companyId) => api.get(`/vehicles/${companyId}`),
  create: (data) => api.post('/create-vehicle', data),
  update: (id, data) => api.put(`/vehicle/${id}`, data),
}
