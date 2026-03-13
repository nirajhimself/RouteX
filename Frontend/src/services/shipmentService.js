import api from '../api/api'
export const shipmentService = {
  getAll: (companyId) => api.get(`/shipments/${companyId}`),
  create: (data) => api.post('/create-shipment', data),
  update: (id, data) => api.put(`/shipment/${id}`, data),
}
