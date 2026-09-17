import axiosInstance from './axiosInstance.js'

export const getStaff = () => axiosInstance.get('/staff')
export const createStaff = (data) => axiosInstance.post('/staff', data)
export const updateStaff = (id, data) => axiosInstance.patch(`/staff/${id}`, data)
export const deactivateStaff = (id) => axiosInstance.patch(`/staff/${id}/deactivate`)
export const resetStaffPassword = (id, newPassword) => axiosInstance.patch(`/staff/${id}/reset-password`, { newPassword })
