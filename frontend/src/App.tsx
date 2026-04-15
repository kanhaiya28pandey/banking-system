import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import AccountPage from './pages/AccountPage'
import TransactionPage from './pages/TransactionPage'
import AtmPage from './pages/AtmPage'
import AdminPage from './pages/AdminPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import ScheduledTransfersPage from './pages/ScheduledTransfersPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/accounts"    element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
          <Route path="/atm"         element={<ProtectedRoute><AtmPage /></ProtectedRoute>} />
          <Route path="/admin"       element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/scheduled-transfers" element={<ProtectedRoute><ScheduledTransfersPage /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
