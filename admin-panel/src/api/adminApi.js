import axiosInstance from './axiosInstance.js'

// Email Verification for Create Café Flow
export async function sendCafeEmailVerification(data) {
  const response = await axiosInstance.post('/super-admin/cafes/send-email-verification', data)
  return response.data
}

export async function verifyCafeEmail(data) {
  const response = await axiosInstance.post('/super-admin/cafes/verify-email', data)
  return response.data
}

// Café / Restaurant Management
export async function createRestaurant(data) {
  const response = await axiosInstance.post('/super-admin/cafes', data)
  return response.data
}

export const createCafe = createRestaurant

export async function getRestaurants() {
  const response = await axiosInstance.get('/super-admin/cafes')
  return response.data
}

export const getCafes = getRestaurants

export async function getRestaurantDetails(id) {
  const response = await axiosInstance.get(`/super-admin/cafes/${id}`)
  return response.data
}

export const getCafeDetails = getRestaurantDetails

export async function updateRestaurant(id, data) {
  const response = await axiosInstance.put(`/super-admin/cafes/${id}`, data)
  return response.data
}

export const updateCafe = updateRestaurant

export async function updateRestaurantStatus(id, isActive) {
  const status = isActive ? 'ACTIVE' : 'INACTIVE'
  const response = await axiosInstance.patch(`/super-admin/cafes/${id}/status`, {
    isActive,
    status,
  })
  return response.data
}

export const updateCafeStatus = updateRestaurantStatus

export async function updateRestaurantPlan(id, plan) {
  const response = await axiosInstance.patch(`/super-admin/cafes/${id}/plan`, { plan })
  return response.data
}

export async function deleteRestaurant(id) {
  const response = await axiosInstance.delete(`/super-admin/cafes/${id}`)
  return response.data
}

export const deleteCafe = deleteRestaurant

// Café Admin Management
export async function getAllCafeAdmins() {
  const response = await axiosInstance.get('/super-admin/admins')
  return response.data
}

export async function updateCafeAdmin(cafeId, data) {
  const response = await axiosInstance.put(`/super-admin/cafes/${cafeId}/admin`, data)
  return response.data
}

export async function updateAdminById(adminId, data) {
  const response = await axiosInstance.patch(`/super-admin/admins/${adminId}`, data)
  return response.data
}

export async function updateCafeAdminStatus(cafeId, isActive) {
  const response = await axiosInstance.patch(`/super-admin/cafes/${cafeId}/admin/status`, {
    isActive,
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  })
  return response.data
}

export async function updateAdminStatusById(adminId, isActive) {
  const response = await axiosInstance.patch(`/super-admin/admins/${adminId}/status`, {
    isActive,
    status: isActive ? 'ACTIVE' : 'INACTIVE',
  })
  return response.data
}

export async function resetCafeAdminPassword(cafeId, newPassword) {
  const response = await axiosInstance.post(`/super-admin/cafes/${cafeId}/admin/reset-password`, {
    newPassword,
  })
  return response.data
}

export async function resetAdminPasswordById(adminId, newPassword) {
  const response = await axiosInstance.post(`/super-admin/admins/${adminId}/reset-password`, {
    newPassword,
  })
  return response.data
}

// Super Admin Reporting & Audit Logs
export async function getSuperAdminPerformanceReport(range = '30d') {
  const response = await axiosInstance.get('/super-admin/reports/overview', {
    params: { range },
  })
  return response.data
}

export async function getAuditLogs(params = {}) {
  const response = await axiosInstance.get('/super-admin/audit-logs', { params })
  return response.data
}

export async function sendDailySalesReport() {
  const response = await axiosInstance.post('/super-admin/reports/send-daily')
  return response.data
}

export async function sendMonthlySalesReport() {
  const response = await axiosInstance.post('/super-admin/reports/send-monthly')
  return response.data
}

// Subscription Plans
export async function getPlans() {
  const response = await axiosInstance.get('/super-admin/plans')
  return response.data
}

export async function createPlan(data) {
  const response = await axiosInstance.post('/super-admin/plans', data)
  return response.data
}

export async function updatePlan(id, data) {
  const response = await axiosInstance.patch(`/super-admin/plans/${id}`, data)
  return response.data
}

export async function deletePlan(id) {
  const response = await axiosInstance.delete(`/super-admin/plans/${id}`)
  return response.data
}
