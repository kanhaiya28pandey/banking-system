import { createSlice } from '@reduxjs/toolkit'

// Get saved data from localStorage on page load
const getSavedUser = () => {
  try {
    const saved = localStorage.getItem('user')
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('Hydrating user from localStorage:', parsed)
      return parsed
    }
  } catch (e) {
    console.error('Failed to parse saved user:', e)
  }
  return null
}

const getSavedToken = () => {
  const token = localStorage.getItem('token')
  console.log('Hydrating token from localStorage:', token ? 'exists' : 'missing')
  return token
}

const savedUser = getSavedUser()
const savedToken = getSavedToken()

const initialState = {
  user: savedUser,
  token: savedToken,
  isAuthenticated: !!(savedToken && savedUser)
}

console.log('Initial auth state:', {
  hasUser: !!savedUser,
  hasToken: !!savedToken,
  isAuthenticated: !!(savedToken && savedUser)
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      console.log('Auth credentials set:', {
        userId: action.payload.user?.id,
        userRole: action.payload.user?.role
      })
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      console.log('User logged out')
    }
  }
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

