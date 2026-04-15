import api from './axiosInstance'

export const deposit = (accountNumber: string, amount: number) =>
  api.post(`/transaction/deposit?accountNumber=${accountNumber}&amount=${amount}`)

export const withdraw = (accountNumber: string, amount: number) =>
  api.post(`/transaction/withdraw?accountNumber=${accountNumber}&amount=${amount}`)

export const transfer = (data: {
  fromAccount: string
  toAccount: string
  amount: number
  description: string
}) => api.post('/transaction/transfer', data)

export const getHistory = (accountNumber: string) =>
  api.get(`/transaction/history/${accountNumber}`)

export const downloadReceipt = (transactionId: string) =>
  api.get(`/transaction/${transactionId}/receipt`, {
    responseType: 'blob'
  })