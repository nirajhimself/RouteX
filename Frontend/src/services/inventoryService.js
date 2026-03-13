import api from '../api/api'
export const inventoryService = {
  getByWarehouse: (warehouseId) => api.get(`/warehouse-inventory/${warehouseId}`),
  add: (data) => api.post('/add-inventory', data),
}
