// src/services/driverService.js
import api from '../api/api'
export const driverService = {
  getAll: (companyId) => api.get(`/drivers/${companyId}`),
  create: (data) => api.post('/create-driver', data),
  update: (id, data) => api.put(`/driver/${id}`, data),
  delete: (id) => api.delete(`/driver/${id}`),
}
