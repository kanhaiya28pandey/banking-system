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
  const [tab, setTab] = useState<'info'|'security'|'kyc'|'pin'>('info')
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [pin, setPin] = useState({ newPin: '', confirmPin: '' })
  const [pinLoading, setPinLoading] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  useEffect(() => { if (user) setForm({ name: user.name||'', phone: user.phone||'' }) }, [user])

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          // Fetch updated user data including KYC info from backend
          const userRes = await api.get(`/user/${user.id}`)
          if (userRes.data.success) {
            // Update Redux store with fresh user data containing KYC information
            dispatch(setCredentials({ user: userRes.data.data, token }))
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err)
        }

        try {
          const res = await api.get(`/account/user/${user.id}`)
          setAccounts(res.data.data || [])
        } catch (err) {
          console.error('Failed to load accounts:', err)
        }
      }
      fetchData()
    }
  }, [user?.id, dispatch])

  const handleUpdate = async () => {
    if (!form.name||!form.phone) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const res = await api.put(`/user/update/${user.id}`, { name: form.name, phone: form.phone })
      if (res.data.success) {
        const updatedUser = {
          ...user,
          ...res.data.data,
          name: form.name,
          phone: form.phone,
          firstName: form.name.split(' ')[0],
          lastName: form.name.split(' ').slice(1).join(' ')
        }
        dispatch(setCredentials({ user: updatedUser, token }))
        toast.success('Profile updated successfully!')
        // Refresh user data and accounts
        setTimeout(async () => {
          try {
            const userRes = await api.get(`/user/${user.id}`)
            if (userRes.data.success) {
              dispatch(setCredentials({ user: userRes.data.data, token }))
            }
          } catch (err) {
            console.error('Failed to refresh user:', err)
          }
        }, 500)
      }
      else toast.error(res.data.message)
    } catch { toast.error('Failed to update profile') }
    setLoading(false)
  }

  const handleChangePwd = async () => {
    if (!pwd.newPassword||!pwd.confirmPassword) { toast.error('Fill all fields'); return }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwd.newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setPwdLoading(true)
    try {
      const res = await api.post(`/auth/reset-password?email=${user.email}&newPassword=${pwd.newPassword}`, {})
      if (res.data.success) { toast.success('Password changed! Login again.'); setTimeout(() => navigate('/login'), 2000) }
      else toast.error(res.data.message)
    } catch { toast.error('Failed') }
    setPwdLoading(false)
  }

  const handleChangePin = async () => {
    if (!selectedAccountId) { toast.error('Please select an account'); return }
    if (!pin.newPin||!pin.confirmPin) { toast.error('Fill all fields'); return }
    if (pin.newPin !== pin.confirmPin) { toast.error('PINs do not match'); return }
    if (pin.newPin.length !== 4 || !/^\d+$/.test(pin.newPin)) { toast.error('PIN must be 4 digits'); return }
    setPinLoading(true)
    try {
      const res = await api.put(`/user/account/${selectedAccountId}/update-pin?transactionPin=${pin.newPin}`, {})
      if (res.data.success) {
        setPin({ newPin: '', confirmPin: '' })
        toast.success('Transaction PIN updated for this account!')
      } else toast.error(res.data.message)
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update PIN') }
    setPinLoading(false)
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
              {[{ label: 'User ID', value: user?.id?.slice(0,12)+'...'||'N/A' }, { label: 'Name', value: user?.name || user?.firstName || 'Not set' }, { label: 'Phone', value: user?.phone||'Not set' }, { label: 'Status', value: user?.status||'ACTIVE' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#4A6080' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '5px', marginBottom: '24px', width: 'fit-content', overflowX: 'auto' }}>
              {[{ key: 'info' as const, label: '👤 Profile Info' }, { key: 'security' as const, label: '🔐 Password' }, { key: 'pin' as const, label: '🔑 Transaction PIN' }, { key: 'kyc' as const, label: '🆔 KYC Info' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '11px 20px', borderRadius: '10px', border: 'none', background: tab === t.key ? 'linear-gradient(135deg, #F5C842, #D4A017)' : 'transparent', color: tab === t.key ? '#060A12' : '#7A8FA6', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.label}</button>
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
              {tab === 'pin' && (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', marginBottom: '28px', letterSpacing: '2px' }}>TRANSACTION PIN SECURITY</div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SELECT ACCOUNT</label>
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="">-- Choose an account --</option>
                      {accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountType?.toUpperCase()} • {acc.accountNumber} • ₹{acc.balance?.toLocaleString() || '0'}
                        </option>
                      ))}
                    </select>
                    {!selectedAccountId && accounts.length === 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#FF4D6D' }}>ℹ️ You don't have any accounts yet</div>
                    )}
                  </div>

                  {selectedAccountId && (
                    <div style={{ background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🔐</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#3B9EFF' }}>PIN Status</div>
                          <div style={{ fontSize: '13px', color: '#4A6080', marginTop: '4px' }}>
                            Set a unique 4-digit PIN for this account's secure transactions
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAccountId ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>NEW 4-DIGIT PIN</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showNewPin?'text':'password'} maxLength={4} inputMode="numeric" style={{ ...inp, paddingRight: '52px', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }} value={pin.newPin} onChange={e => setPin({...pin, newPin: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="••••" />
                          <button onClick={() => setShowNewPin(!showNewPin)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: showNewPin?'#3B9EFF':'#4A6080', padding: 0 }}>{showNewPin?'🙈':'👁️'}</button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '28px' }}>
                        <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CONFIRM PIN</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showConfirmPin?'text':'password'} maxLength={4} inputMode="numeric" style={{ ...inp, paddingRight: '52px', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }} value={pin.confirmPin} onChange={e => setPin({...pin, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4)})} placeholder="••••" />
                          <button onClick={() => setShowConfirmPin(!showConfirmPin)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: showConfirmPin?'#3B9EFF':'#4A6080', padding: 0 }}>{showConfirmPin?'🙈':'👁️'}</button>
                        </div>
                        {pin.confirmPin && <div style={{ marginTop: '8px', fontSize: '12px', color: pin.newPin===pin.confirmPin?'#00FFB2':'#FF4D6D' }}>{pin.newPin===pin.confirmPin?'✓ Match':'✗ No match'}</div>}
                      </div>

                      <div style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '24px', fontSize: '12px', color: '#00FFB2', lineHeight: '1.6' }}>
                        ℹ️ Use this 4-digit PIN to verify sensitive transactions like quick transfers and withdrawals at ATM. Keep it secret and never share it with anyone.
                      </div>

                      <button onClick={handleChangePin} disabled={pinLoading || pin.newPin.length !== 4 || pin.confirmPin.length !== 4} style={{ background: pin.newPin.length === 4 && pin.confirmPin.length === 4 ? 'linear-gradient(135deg, #F5C842, #D4A017)' : 'rgba(245,200,66,0.3)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '16px 40px', fontSize: '12px', fontWeight: '700', cursor: pin.newPin.length === 4 ? 'pointer' : 'not-allowed', letterSpacing: '1.5px', opacity: pinLoading?0.7:1 }}>{pinLoading?'SAVING...':'SET PIN FOR THIS ACCOUNT →'}</button>
                    </>
                  ) : (
                    <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#FF4D6D' }}>
                      Please select an account above to set its transaction PIN
                    </div>
                  )}
                </>
              )}
              {tab === 'kyc' && (
                <>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', marginBottom: '28px', letterSpacing: '2px' }}>KYC & PERSONAL INFORMATION</div>

                  {/* Personal Details Section */}
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: '12px', color: '#00FFB2', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>PERSONAL DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {[
                        { label: 'Full Name', value: user?.name || 'Not set' },
                        { label: 'Email', value: user?.email || 'Not set' },
                        { label: 'Phone', value: user?.phone || 'Not set' },
                        { label: 'Address', value: user?.address || 'Not set' },
                        { label: 'City', value: user?.city || 'Not set' },
                        { label: 'State', value: user?.state || 'Not set' }
                      ].map((item, i) => (
                        <div key={i}>
                          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: '700' }}>{item.label}</label>
                          <div style={{ fontSize: '14px', color: '#F0EFEA', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KYC Information Section */}
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: '12px', color: '#3B9EFF', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>KYC INFORMATION</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {[
                        { label: 'Full Name', value: user?.name || user?.firstName || 'Not provided' },
                        { label: 'Phone Number', value: user?.phone || 'Not provided' },
                        { label: 'Religion', value: user?.religion || 'Not provided' },
                        { label: 'Category', value: user?.category || 'Not provided' },
                        { label: 'Income Range', value: user?.incomeRange || 'Not provided' },
                        { label: 'Educational Qualification', value: user?.educationalQualification || 'Not provided' },
                        { label: 'Occupation', value: user?.occupation || 'Not provided' },
                        { label: 'PAN Number', value: user?.panNumber || 'Not provided' },
                        { label: 'Aadhaar Number', value: user?.aadhaarNumber ? user.aadhaarNumber.slice(-4).padStart(user.aadhaarNumber.length, '*') : 'Not provided' },
                        { label: 'Senior Citizen', value: user?.seniorCitizen ? 'Yes' : 'No' }
                      ].map((item, i) => (
                        <div key={i}>
                          <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '6px', fontWeight: '700' }}>{item.label}</label>
                          <div style={{ fontSize: '14px', color: '#F0EFEA', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Details Section */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#00FFB2', fontWeight: '700', marginBottom: '16px', letterSpacing: '1px' }}>ACCOUNT DETAILS</div>
                    {accounts.length === 0 ? (
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: '#4A6080' }}>No accounts created yet</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {accounts.map((acc, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                              <div>
                                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '4px', fontWeight: '700' }}>ACCOUNT NUMBER</label>
                                <div style={{ fontSize: '13px', color: '#F5C842', fontFamily: 'monospace', fontWeight: '700' }}>{acc.accountNumber}</div>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '4px', fontWeight: '700' }}>ACCOUNT TYPE</label>
                                <div style={{ fontSize: '13px', color: '#F0EFEA' }}>{acc.accountType}</div>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '4px', fontWeight: '700' }}>BALANCE</label>
                                <div style={{ fontSize: '13px', color: '#00FFB2', fontWeight: '700' }}>₹{(acc.balance || 0).toLocaleString('en-IN')}</div>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '1px', display: 'block', marginBottom: '4px', fontWeight: '700' }}>STATUS</label>
                                <div style={{ fontSize: '13px', color: acc.status === 'ACTIVE' ? '#00FFB2' : '#FF4D6D' }}>● {acc.status}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
