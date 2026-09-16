import axiosInstance from './axiosInstance.js'

export const getRecipe = (menuItemId) => axiosInstance.get(`/recipes/${menuItemId}`)
export const upsertRecipe = (menuItemId, ingredients) => axiosInstance.put(`/recipes/${menuItemId}`, { ingredients })
export const deleteRecipe = (menuItemId) => axiosInstance.delete(`/recipes/${menuItemId}`)
