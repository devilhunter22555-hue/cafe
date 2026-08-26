import axiosInstance from './axiosInstance.js'

export const getCategories = () => axiosInstance.get('/categories')
export const createCategory = (data) => axiosInstance.post('/categories', data)
export const updateCategory = (id, data) => axiosInstance.patch(`/categories/${id}`, data)
export const deleteCategory = (id) => axiosInstance.delete(`/categories/${id}`)

export const getMenuItems = (categoryId) => axiosInstance.get('/menu-items', {
  params: categoryId ? { categoryId } : undefined,
})
export const createMenuItem = (data) => axiosInstance.post('/menu-items', data)
export const updateMenuItem = (id, data) => axiosInstance.patch(`/menu-items/${id}`, data)
export const toggleAvailability = (id, isAvailable) => axiosInstance.patch(`/menu-items/${id}/availability`, { isAvailable })
export const deleteMenuItem = (id) => axiosInstance.delete(`/menu-items/${id}`)

export const getModifierGroups = () => axiosInstance.get('/modifiers')
export const createModifierGroup = (data) => axiosInstance.post('/modifiers', data)