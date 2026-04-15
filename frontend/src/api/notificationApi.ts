import api from './axiosInstance'

export const getNotificationPreferences = () => {
  return api.get('/notification/preferences')
}

export const updateNotificationPreferences = (data: any) => {
  return api.put('/notification/preferences', data)
}

export const getNotificationLogs = () => {
  return api.get('/notification/logs')
}

export const sendTestNotification = () => {
  return api.post('/notification/test', {})
}
