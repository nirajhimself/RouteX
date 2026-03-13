import api from '../api/api'
export const warehouseService = {
  getAll: (companyId) => api.get(`/warehouses/${companyId}`),
  create: (data) => api.post('/create-warehouse', data),
}
