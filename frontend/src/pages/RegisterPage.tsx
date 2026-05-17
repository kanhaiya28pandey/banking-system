import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((s: any) => s.auth)

  if (isAuthenticated) return <Navigate to="/" replace />

  const validateForm = () => {
    if (!form.email.trim()) { toast.error('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email'); return false }
    if (!form.password) { toast.error('Password is required'); return false }
    if (form.password.length < 8) { toast.error('Password min 8 characters'); return false }
    if (!form.password.match(/[A-Z]/)) { toast.error('Password needs uppercase'); return false }
    if (!form.password.match(/[a-z]/)) { toast.error('Password needs lowercase'); return false }
    if (!form.password.match(/[0-9]/)) { toast.error('Password needs digit'); return false }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false }
    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await api.post('/auth/simple-register', {
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      })
      if (res.data.success) {
        toast.success('✅ Registration successful! Please login.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        toast.error(res.data.message || 'Registration failed')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  const inputStyle: any = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '14px 18px', color: '#F0EFEA', fontSize: '15px',
    outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060A12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px)',
      backgroundSize: '48px 48px'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0D1829 0%, #080E1A 100%)',
        border: '1px solid rgba(245,200,66,0.2)', borderRadius: '24px',
        padding: '52px', width: '100%', maxWidth: '440px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, #F5C842, transparent)' }} />

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '68px', height: '68px', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 18px', boxShadow: '0 0 40px rgba(245,200,66,0.5)'
          }}>🏦</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#F5C842', letterSpacing: '4px' }}>REGISTER</div>
          <div style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '5px', marginTop: '6px' }}>CREATE LOGIN ACCOUNT</div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>EMAIL ADDRESS</label>
          <input type="email" placeholder="your.email@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase, lowercase, digit" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ ...inputStyle, paddingRight: '52px' }} />
            <button onClick={() => setShowPwd(!showPwd)} style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
              color: showPwd ? '#F5C842' : '#4A6080', padding: 0
            }}>{showPwd ? '🙈' : '👁️'}</button>
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CONFIRM PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <input type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              style={{ ...inputStyle, paddingRight: '52px' }} />
            <button onClick={() => setShowConfirm(!showConfirm)} style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
              color: showConfirm ? '#F5C842' : '#4A6080', padding: 0
            }}>{showConfirm ? '🙈' : '👁️'}</button>
          </div>
          {form.confirmPassword && (
            <div style={{
              marginTop: '6px', fontSize: '12px',
              color: form.password === form.confirmPassword ? '#00FFB2' : '#FF4D6D'
            }}>
              {form.password === form.confirmPassword ? '✓ Match' : '✗ No match'}
            </div>
          )}
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
          color: '#060A12', border: 'none', borderRadius: '12px', padding: '16px',
          fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)',
          opacity: loading ? 0.7 : 1
        }}>{loading ? 'REGISTERING...' : 'REGISTER →'}</button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#7A8FA6' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#F5C842', textDecoration: 'none', fontWeight: '700' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
