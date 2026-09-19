import axiosInstance from './axiosInstance.js'

export const getCoupons = () => axiosInstance.get('/coupons')
export const createCoupon = (data) => axiosInstance.post('/coupons', data)
export const updateCoupon = (id, data) => axiosInstance.patch(`/coupons/${id}`, data)
export const deleteCoupon = (id) => axiosInstance.patch(`/coupons/${id}/delete`)
export const validateCoupon = (data) => axiosInstance.post('/coupons/validate', data)
