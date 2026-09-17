import axiosInstance from './axiosInstance.js'

export const getPriceTrends = (days = 30) => axiosInstance.get('/insights/price-trends', { params: { days } })
export const getFoodCostSummary = (from, to) => axiosInstance.get('/insights/food-cost-summary', { params: { from, to } })
export const getLowStockForecast = () => axiosInstance.get('/insights/low-stock-forecast')
