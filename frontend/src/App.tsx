import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { Toaster } from 'react-hot-toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MultiStepRegistration from './pages/MultiStepRegistration'
import Dashboard from './pages/Dashboard'
import AccountPage from './pages/AccountPage'
import TransactionPage from './pages/TransactionPage'
import AtmPage from './pages/AtmPage'
import AdminPage from './pages/AdminPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import ScheduledTransfersPage from './pages/ScheduledTransfersPage'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import UserDashboard from './pages/UserDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/register-account" element={<MultiStepRegistration />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />

          {/* Role-Based Dashboards */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manager-dashboard" element={<ProtectedRoute requiredRoles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/employee-dashboard" element={<ProtectedRoute requiredRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/user-dashboard" element={<ProtectedRoute requiredRoles={['USER']}><UserDashboard /></ProtectedRoute>} />

          {/* Legacy routes - redirects to dashboard */}
          <Route path="/"            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/accounts"    element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
          <Route path="/atm"         element={<ProtectedRoute><AtmPage /></ProtectedRoute>} />
          <Route path="/admin"       element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/scheduled-transfers" element={<ProtectedRoute><ScheduledTransfersPage /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
