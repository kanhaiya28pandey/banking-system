import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials } from '../store/authSlice'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((s: any) => s.auth)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data.success) {
        const token = res.data.data
        const userRes = await api.get(
          `/user/by-email?email=${email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const user = userRes.data.data
        console.log('User object received:', user)
        console.log('User ID:', user.id, 'Length:', user.id?.length)
        dispatch(setCredentials({ user, token }))
        toast.success('Access granted!')

        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin-dashboard')
        } else if (user.role === 'MANAGER') {
          navigate('/manager-dashboard')
        } else if (user.role === 'EMPLOYEE') {
          navigate('/employee-dashboard')
        } else {
          navigate('/user-dashboard')
        }
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      toast.error('Authentication failed.')
    }
    setLoading(false)
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

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '68px', height: '68px',
            background: 'linear-gradient(135deg, #F5C842, #D4A017)',
            borderRadius: '18px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '32px', margin: '0 auto 18px',
            boxShadow: '0 0 40px rgba(245,200,66,0.5)'
          }}>🏦</div>
          <div style={{ fontFamily: 'sans-serif', fontSize: '26px', fontWeight: '900', color: '#F5C842', letterSpacing: '4px' }}>NEXBANK</div>
          <div style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '5px', marginTop: '6px' }}>SECURE BANKING PORTAL</div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>EMAIL ADDRESS</label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@nexbank.com"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              padding: '14px 18px', color: '#F0EFEA',
              fontSize: '15px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px' }}>PASSWORD</label>
            <Link to="/forgot-password" style={{ fontSize: '11px', color: '#F5C842', textDecoration: 'none' }}>FORGOT?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '14px 52px 14px 18px', color: '#F0EFEA',
                fontSize: '15px', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <button onClick={() => setShowPwd(!showPwd)} style={{
              position: 'absolute', right: '16px', top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: '18px',
              color: showPwd ? '#F5C842' : '#4A6080', padding: 0
            }}>{showPwd ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <button
          onClick={handleLogin} disabled={loading}
          style={{
            width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
            color: '#060A12', border: 'none', borderRadius: '12px',
            padding: '16px', fontSize: '13px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)',
            opacity: loading ? 0.7 : 1
          }}
        >{loading ? 'AUTHENTICATING...' : 'ACCESS ACCOUNT →'}</button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#7A8FA6' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#F5C842', textDecoration: 'none', fontWeight: '700' }}>
            Create one now
          </Link>
        </p>
      </div>
    </div>
  )
}
