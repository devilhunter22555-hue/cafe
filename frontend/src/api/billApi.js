import axiosInstance from './axiosInstance.js'

export const getBills = (from, to) => axiosInstance.get('/bills', {
  params: { from, to }
})
