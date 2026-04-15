import api from './axiosInstance'

export const createScheduledTransfer = (data: {
  fromAccount: string
  toAccount: string
  amount: number
  recurrencePattern: string
  startDate: string
  endDate?: string
  description?: string
  notificationStatus?: string
}) => api.post('/scheduled-transfer/create', data)

export const getScheduledTransfers = () =>
  api.get('/scheduled-transfer/list')

export const pauseScheduledTransfer = (id: string) =>
  api.put(`/scheduled-transfer/${id}/pause`, {})

export const resumeScheduledTransfer = (id: string) =>
  api.put(`/scheduled-transfer/${id}/resume`, {})

export const cancelScheduledTransfer = (id: string) =>
  api.delete(`/scheduled-transfer/${id}`)
