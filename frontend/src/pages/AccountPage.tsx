import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function AccountPage() {
  const { user, token } = useSelector((s: any) => s.auth)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [accType, setAccType] = useState('SAVINGS')
  const [creating, setCreating] = useState(false)
  const headers = { headers: { Authorization: `Bearer ${token}` } }

  const fetchAccounts = async () => {
    console.log('User object in AccountPage:', user)
    console.log('User ID:', user?.id, 'Type:', typeof user?.id, 'Length:', user?.id?.length)
    if (!user?.id) {
      console.error('User ID not found:', user)
      setLoading(false)
      return
    }
    try {
      const res = await api.get(`/account/user/${user.id}`, headers)
      setAccounts(res.data.data || [])
    } catch (err: any) {
      console.error('Full error response:', err.response?.data)
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      console.error('Failed to load accounts:', errorMsg)
      toast.error('Failed to load accounts: ' + errorMsg)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAccounts() }, [user])

  const handleCreate = async () => {
    if (!user?.id) { toast.error('Please re-login'); return }
    setCreating(true)
    try {
      const res = await api.post(
        `/account/create?userId=${user.id}&accountType=${accType}`,
        {}, headers)
      if (res.data.success) {
        toast.success(`${accType} account created!`)
        setShowCreate(false)
        fetchAccounts()
      } else { toast.error(res.data.message) }
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed') }
    setCreating(false)
  }

  const colors = ['#F5C842', '#3B9EFF', '#00FFB2', '#FF4D6D']
  const icons = ['💰', '💼', '🏦', '💳']
  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>ACCOUNT MANAGEMENT</div>
            <div style={{ fontSize: '34px', fontWeight: '700' }}>My <span style={{ color: '#F5C842' }}>Accounts</span></div>
            <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>{accounts.length} account(s) · Live from MongoDB</div>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} style={{
            background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12',
            border: 'none', borderRadius: '12px', padding: '14px 24px',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px'
          }}>+ NEW ACCOUNT</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Accounts', value: accounts.length, color: '#F5C842' },
            { label: 'Total Balance', value: `₹${total.toLocaleString('en-IN')}`, color: '#00FFB2' },
            { label: 'Active', value: accounts.filter(a => a.status === 'ACTIVE').length, color: '#3B9EFF' },
            { label: 'Blocked', value: accounts.filter(a => a.status === 'BLOCKED').length, color: '#FF4D6D' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
              <div style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', marginBottom: '8px' }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {showCreate && (
          <div style={{ background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '18px', padding: '28px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', marginBottom: '20px', letterSpacing: '2px' }}>✦ CREATE NEW ACCOUNT</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ACCOUNT TYPE</label>
                <select value={accType} onChange={e => setAccType(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', color: '#F0EFEA', fontSize: '15px', outline: 'none' }}>
                  <option value="SAVINGS">💰 Savings Account</option>
                  <option value="CURRENT">💼 Current Account</option>
                </select>
              </div>
              <button onClick={handleCreate} disabled={creating} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px', opacity: creating ? 0.7 : 1, whiteSpace: 'nowrap' as const }}>
                {creating ? 'CREATING...' : 'CREATE →'}
              </button>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#4A6080', fontSize: '13px', letterSpacing: '2px' }}>LOADING ACCOUNTS...</div>}

        {!loading && accounts.length === 0 && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
            <div style={{ fontSize: '15px', color: '#F5C842', marginBottom: '8px', fontWeight: '700' }}>NO ACCOUNTS YET</div>
            <div style={{ fontSize: '13px', color: '#4A6080', marginBottom: '24px' }}>Create your first bank account to get started</div>
            <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px' }}>+ CREATE FIRST ACCOUNT</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }}>
          {accounts.map((acc, i) => {
            const color = colors[i % colors.length]
            const icon = icons[i % icons.length]
            return (
              <div key={acc.id} style={{ background: 'linear-gradient(160deg, #0D1829 0%, #080E1A 100%)', border: `1px solid ${color}20`, borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '15px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{icon}</div>
                  <span style={{ background: acc.status === 'ACTIVE' ? 'rgba(0,255,178,0.12)' : 'rgba(255,77,109,0.12)', color: acc.status === 'ACTIVE' ? '#00FFB2' : '#FF4D6D', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>● {acc.status}</span>
                </div>
                <div style={{ fontSize: '10px', color: color, letterSpacing: '4px', marginBottom: '8px' }}>{acc.accountType} ACCOUNT</div>
                <div style={{ fontSize: '13px', color: '#4A6080', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'monospace' }}>{acc.accountNumber}</div>
                <div style={{ fontSize: '34px', fontWeight: '900', color: '#F0EFEA', letterSpacing: '-2px', marginBottom: '20px' }}>₹{(acc.balance || 0).toLocaleString('en-IN')}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); toast.success('Copied!') }} style={{ flex: 1, background: `${color}12`, border: `1px solid ${color}25`, color: color, borderRadius: '12px', padding: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px' }}>COPY NO.</button>
                  <button onClick={() => toast.success(`Balance: ₹${(acc.balance||0).toLocaleString('en-IN')}`)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EFEA', borderRadius: '12px', padding: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1.5px' }}>VIEW</button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
