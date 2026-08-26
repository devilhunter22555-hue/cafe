import axiosInstance from './axiosInstance.js'

export const getMenu = () => axiosInstance.get('/customer/menu')
export const placeOrder = (items) => axiosInstance.post('/customer/orders', { items })
export const getOrderStatus = () => axiosInstance.get('/customer/orders/status')
