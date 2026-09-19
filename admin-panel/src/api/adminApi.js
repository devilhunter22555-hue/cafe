import axiosInstance from './axiosInstance.js'

export async function getRestaurants() {
  const response = await axiosInstance.get('/super-admin/restaurants')
  return response.data
}

export async function getRestaurantDetails(id) {
  const response = await axiosInstance.get(`/super-admin/restaurants/${id}`)
  return response.data
}

export async function updateRestaurantStatus(id, isActive) {
  const response = await axiosInstance.patch(`/super-admin/restaurants/${id}/status`, { isActive })
  return response.data
}

export async function updateRestaurantPlan(id, plan) {
  const response = await axiosInstance.patch(`/super-admin/restaurants/${id}/plan`, { plan })
  return response.data
}

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
