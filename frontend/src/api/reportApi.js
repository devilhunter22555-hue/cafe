import axiosInstance from './axiosInstance.js'

export const getSalesSummary = (from, to) => axiosInstance.get('/reports/summary', { params: { from, to } })
export const getSalesByDay = (from, to) => axiosInstance.get('/reports/sales-by-day', { params: { from, to } })
export const getTopSellingItems = (from, to, limit = 10) => axiosInstance.get('/reports/top-items', { params: { from, to, limit } })
export const getCategoryBreakdown = (from, to) => axiosInstance.get('/reports/category-breakdown', { params: { from, to } })
export const sendDailyReportEmail = () => axiosInstance.post('/reports/send-daily')
export const sendMonthlyReportEmail = () => axiosInstance.post('/reports/send-monthly')
