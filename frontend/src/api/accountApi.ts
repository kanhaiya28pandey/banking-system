import api from './axiosInstance'

export const createAccount = (userId: string, accountType: string) =>
  api.post(`/account/create?userId=${userId}&accountType=${accountType}`)

export const getAccountsByUser = (userId: string) =>
  api.get(`/account/user/${userId}`)

export const getAccountByNumber = (accountNumber: string) =>
  api.get(`/account/${accountNumber}`)

export const blockAccount = (accountNumber: string) =>
  api.put(`/account/block/${accountNumber}`)

export const unblockAccount = (accountNumber: string) =>
  api.put(`/account/unblock/${accountNumber}`)