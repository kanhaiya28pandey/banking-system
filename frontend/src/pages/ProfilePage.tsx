import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { setCredentials } from '../store/authSlice'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function ProfilePage() {
  const { user, token } = useSelector((s: any) => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '' })
  const [pwd, setPwd] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [tab, setTab] = useState<'info'|'security'>('info')
  const headers = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => { if (user) setForm({ name: user.name||'', phone: user.phone||'' }) }, [user])

  const handleUpdate = async () => {
    if (!form.name||!form.phone) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.put(`/user/update/${user.id}`, { name: form.name, phone: form.phone }, headers)
      if (res.data.success) { dispatch(setCredentials({ user: { ...user, ...res.data.data }, token })); toast.success('Profile updated!') }
      else toast.error(res.data.message)
    } catch { toast.error('Failed') }
    setLoading(false)
  }

  const handleChangePwd = async () => {
    if (!pwd.newPassword||!pwd.confirmPassword) { toast.error('Fill all fields'); return }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwd.newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setPwdLoading(true)
    try {
      const res = await api.post(`/auth/reset-password?email=${user.email}&newPassword=${pwd.newPassword}`, {}, headers)
      if (res.data.success) { toast.success('Password changed! Login again.'); setTimeout(() => navigate('/login'), 2000) }
      else toast.error(res.data.message)
    } catch { toast.error('Failed') }
    setPwdLoading(false)
  }

  const inp: any = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', color: '#F0EFEA', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>USER SETTINGS</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>My <span style={{ color: '#F5C842' }}>Profile</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage your info and security</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(160deg, #0D1829, #080E1A)', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '24px', padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'linear-gradient(90deg, transparent, #F5C842, transparent)' }} />
              <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'linear-gradient(135deg, #F5C842, #D4A017)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '900', color: '#060A12', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(245,200,66,0.4)' }}>
                {user?.name?.charAt(0)?.toUpperCase()||user?.email?.charAt(0)?.toUpperCase()||'U'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>{user?.name||'User'}</div>
              <div style={{ fontSize: '13px', color: '#4A6080', marginBottom: '16px' }}>{user?.email}</div>
              <span style={{ background: 'rgba(0,255,178,0.15)', color: '#00FFB2', padding: '6px 18px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '2px' }}>● {user?.role||'CUSTOMER'}</span>
            </div>
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '22px' }}>
              <div style={{ fontSize: '10px', color: '#3A5070', letterSpacing: '2px', marginBottom: '16px' }}>ACCOUNT INFO</div>
              {[{ label: 'User ID', value: user?.id?.slice(0,12)+'...'||'N/A' }, { label: 'Phone', value: user?.phone||'Not set' }, { label: 'Status', value: user?.status||'ACTIVE' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#4A6080' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '5px', marginBottom: '24px', width: 'fit-content' }}>
              {[{ key: 'info' as const, label: '👤 Profile Info' }, { key: 'security' as const, label: '🔐 Change Password' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: tab === t.key ? 'linear-gradient(135deg, #F5C842, #D4A017)' : 'transparent', color: tab === t.key ? '#060A12' : '#7A8FA6', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{t.label}</button>
              ))}
            </div>

            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>
              {tab === 'info' && (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', marginBottom: '28px', letterSpacing: '2px' }}>UPDATE PROFILE</div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>EMAIL (READ ONLY)</label>
                    <input style={{ ...inp, color: '#4A6080', cursor: 'not-allowed' }} value={user?.email||''} readOnly />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>FULL NAME</label>
                      <input style={inp} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>PHONE</label>
                      <input style={inp} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9999999999" />
                    </div>
                  </div>
                  <button onClick={handleUpdate} disabled={loading} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '16px 40px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px', opacity: loading ? 0.7 : 1 }}>{loading ? 'SAVING...' : 'SAVE CHANGES →'}</button>
                </>
              )}
              {tab === 'security' && (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', marginBottom: '28px', letterSpacing: '2px' }}>CHANGE PASSWORD</div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>NEW PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showNew?'text':'password'} style={{ ...inp, paddingRight: '52px' }} value={pwd.newPassword} onChange={e => setPwd({...pwd, newPassword: e.target.value})} placeholder="Min. 6 characters" />
                      <button onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: showNew?'#F5C842':'#4A6080', padding: 0 }}>{showNew?'🙈':'👁️'}</button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CONFIRM PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirm?'text':'password'} style={{ ...inp, paddingRight: '52px' }} value={pwd.confirmPassword} onChange={e => setPwd({...pwd, confirmPassword: e.target.value})} placeholder="Re-enter password" />
                      <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: showConfirm?'#F5C842':'#4A6080', padding: 0 }}>{showConfirm?'🙈':'👁️'}</button>
                    </div>
                    {pwd.confirmPassword && <div style={{ marginTop: '8px', fontSize: '12px', color: pwd.newPassword===pwd.confirmPassword?'#00FFB2':'#FF4D6D' }}>{pwd.newPassword===pwd.confirmPassword?'✓ Match':'✗ No match'}</div>}
                  </div>
                  <button onClick={handleChangePwd} disabled={pwdLoading} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '16px 40px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px', opacity: pwdLoading?0.7:1 }}>{pwdLoading?'CHANGING...':'CHANGE PASSWORD →'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
