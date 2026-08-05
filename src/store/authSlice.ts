import { createSlice } from '@reduxjs/toolkit'

const AUTH_KEY = 'expensio_auth'

interface AuthState {
  isAuthenticated: boolean
  showPinModal: boolean
}

const initialState: AuthState = {
  isAuthenticated: localStorage.getItem(AUTH_KEY) === 'true',
  showPinModal: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state) => {
      state.isAuthenticated = true
      state.showPinModal = false
      localStorage.setItem(AUTH_KEY, 'true')
    },
    logout: (state) => {
      state.isAuthenticated = false
      localStorage.removeItem(AUTH_KEY)
    },
    openPinModal: (state) => {
      state.showPinModal = true
    },
    closePinModal: (state) => {
      state.showPinModal = false
    },
  },
})

export const { login, logout, openPinModal, closePinModal } = authSlice.actions
export default authSlice.reducer