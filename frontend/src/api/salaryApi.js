import axiosInstance from './axiosInstance.js'

export const setStaffSalary = (userId, monthlySalary) => axiosInstance.patch(`/salary/staff/${userId}`, { monthlySalary })
export const generateMonthlySalaryRecords = (month) => axiosInstance.post('/salary/generate', { month })
export const getSalaryRecords = (month, status) => {
  const params = {}
  if (month) params.month = month
  if (status) params.status = status
  return axiosInstance.get('/salary', { params })
}
export const markSalaryPaid = (id, paymentMode, note) => axiosInstance.patch(`/salary/${id}/pay`, { paymentMode, note })
export const getMySalaryHistory = () => axiosInstance.get('/salary/my-history')
