import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((s: any) => s.auth)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      toast.error('Fill all fields'); return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      if (res.data.success) {
        toast.success('Account created! Please login.')
        navigate('/login')
      } else { toast.error(res.data.message) }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration failed.')
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
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#F5C842', letterSpacing: '4px' }}>CREATE ACCOUNT</div>
          <div style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '5px', marginTop: '6px' }}>JOIN NEXBANK TODAY</div>
        </div>

        {[
          { name: 'name', label: 'FULL NAME', type: 'text', placeholder: 'John Doe' },
          { name: 'email', label: 'EMAIL', type: 'email', placeholder: 'you@nexbank.com' },
          { name: 'phone', label: 'PHONE', type: 'text', placeholder: '9999999999' },
        ].map(f => (
          <div key={f.name} style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>{f.label}</label>
            <input name={f.name} type={f.type} placeholder={f.placeholder}
              value={(form as any)[f.name]} onChange={handle} style={inputStyle} />
          </div>
        ))}

        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <input name="password" type={showPwd ? 'text' : 'password'}
              placeholder="Min. 6 characters" value={form.password} onChange={handle}
              style={{ ...inputStyle, paddingRight: '52px' }} />
            <button onClick={() => setShowPwd(!showPwd)} style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
              color: showPwd ? '#F5C842' : '#4A6080', padding: 0
            }}>{showPwd ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
          color: '#060A12', border: 'none', borderRadius: '12px', padding: '16px',
          fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)',
          opacity: loading ? 0.7 : 1
        }}>{loading ? 'CREATING...' : 'CREATE ACCOUNT →'}</button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#7A8FA6' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#F5C842', textDecoration: 'none', fontWeight: '700' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
