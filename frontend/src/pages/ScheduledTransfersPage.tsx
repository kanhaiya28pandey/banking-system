import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'
import { createScheduledTransfer, getScheduledTransfers, pauseScheduledTransfer, resumeScheduledTransfer, cancelScheduledTransfer } from '../api/scheduledTransferApi'

export default function ScheduledTransfersPage() {
  const { user } = useSelector((s: any) => s.auth)
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [headers, setHeaders] = useState<any>({})

  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    recurrencePattern: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    notificationStatus: 'ENABLED',
  })

  useEffect(() => {
    const { token } = useSelector((s: any) => s.auth)
    if (token) {
      setHeaders({ headers: { Authorization: `Bearer ${token}` } })
    }
  }, [])

  useEffect(() => {
    if (!user?.id || !headers.headers) return
    fetchAccounts()
    fetchTransfers()
  }, [user, headers])

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/account/user/${user.id}`, headers)
      setAccounts(res.data.data || [])
      if (res.data.data?.length > 0) {
        setFormData(prev => ({ ...prev, fromAccount: res.data.data[0].accountNumber }))
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err)
    }
  }

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const res = await getScheduledTransfers()
      setTransfers(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load scheduled transfers')
    }
    setLoading(false)
  }

  const handleCreateTransfer = async () => {
    if (!formData.fromAccount || !formData.toAccount || !formData.amount) {
      toast.error('Fill all required fields')
      return
    }

    setCreating(true)
    try {
      await createScheduledTransfer({
        ...formData,
        amount: parseFloat(formData.amount),
        endDate: formData.endDate || undefined,
      })
      toast.success('Scheduled transfer created!')
      setFormData({
        fromAccount: formData.fromAccount,
        toAccount: '',
        amount: '',
        recurrencePattern: 'DAILY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        notificationStatus: 'ENABLED',
      })
      fetchTransfers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create transfer')
    }
    setCreating(false)
  }

  const handlePause = async (id: string) => {
    try {
      await pauseScheduledTransfer(id)
      toast.success('Transfer paused')
      fetchTransfers()
    } catch (err) {
      toast.error('Failed to pause transfer')
    }
  }

  const handleResume = async (id: string) => {
    try {
      await resumeScheduledTransfer(id)
      toast.success('Transfer resumed')
      fetchTransfers ()
    } catch (err) {
      toast.error('Failed to resume transfer')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelScheduledTransfer(id)
      toast.success('Transfer cancelled')
      fetchTransfers()
    } catch (err) {
      toast.error('Failed to cancel transfer')
    }
  }

  const inp: any = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#F0EFEA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#00FFB2'
      case 'PAUSED':
        return '#F5C842'
      case 'COMPLETED':
        return '#3B9EFF'
      case 'CANCELLED':
        return '#FF4D6D'
      default:
        return '#F0EFEA'
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>AUTOMATION</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Scheduled <span style={{ color: '#F5C842' }}>Transfers</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Create & manage recurring payments automatically</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            {/* Create New Transfer */}
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', letterSpacing: '2px', marginBottom: '20px' }}>CREATE SCHEDULED TRANSFER</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>FROM ACCOUNT</label>
                  <select value={formData.fromAccount} onChange={e => setFormData(prev => ({ ...prev, fromAccount: e.target.value }))} style={inp}>
                    {accounts.map(acc => <option key={acc.id} value={acc.accountNumber}>{acc.accountType} — {acc.accountNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>TO ACCOUNT</label>
                  <input value={formData.toAccount} onChange={e => setFormData(prev => ({ ...prev, toAccount: e.target.value }))} placeholder="Enter account number" style={inp} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>AMOUNT (₹)</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))} placeholder="0" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>FREQUENCY</label>
                  <select value={formData.recurrencePattern} onChange={e => setFormData(prev => ({ ...prev, recurrencePattern: e.target.value }))} style={inp}>
                    <option value="ONCE">One Time</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>START DATE</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>END DATE (Optional)</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <input value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional description" style={inp} />
              </div>

              <button
                onClick={handleCreateTransfer}
                disabled={creating}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #F5C842, #D4A017)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#060A12',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.7 : 1,
                  letterSpacing: '1px',
                }}
              >
                {creating ? 'CREATING...' : '⏲️ CREATE SCHEDULE'}
              </button>
            </div>

            {/* Active Transfers */}
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', letterSpacing: '2px', marginBottom: '16px' }}>SCHEDULED TRANSFERS ({transfers.length})</div>

              {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#4A6080' }}>LOADING...</div>}
              {!loading && transfers.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#4A6080' }}><div style={{ fontSize: '24px', marginBottom: '12px' }}>📭</div>No scheduled transfers yet</div>}

              {transfers.map((tx: any) => (
                <div key={tx.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>₹{(tx.amount || 0).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: '#3A5070' }}>{tx.fromAccount} → {tx.toAccount}</div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: statusColor(tx.status), background: `${statusColor(tx.status)}20`, padding: '4px 8px', borderRadius: '6px' }}>
                      {tx.status}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '11px', color: '#7A8FA6', marginBottom: '12px' }}>
                    <div><span style={{ color: '#4A6080' }}>Frequency:</span> {tx.recurrencePattern}</div>
                    <div><span style={{ color: '#4A6080' }}>Executed:</span> {tx.executionCount}</div>
                    <div><span style={{ color: '#4A6080' }}>Next:</span> {tx.nextExecutionDate ? new Date(tx.nextExecutionDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                    <div><span style={{ color: '#4A6080' }}>Created:</span> {new Date(tx.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {tx.status === 'ACTIVE' && (
                      <button
                        onClick={() => handlePause(tx.id)}
                        style={{
                          flex: 1,
                          background: 'rgba(245,200,66,0.15)',
                          border: '1px solid rgba(245,200,66,0.3)',
                          color: '#F5C842',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          letterSpacing: '1px',
                        }}
                      >
                        ⏸️ PAUSE
                      </button>
                    )}
                    {tx.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(tx.id)}
                        style={{
                          flex: 1,
                          background: 'rgba(0,255,178,0.15)',
                          border: '1px solid rgba(0,255,178,0.3)',
                          color: '#00FFB2',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          letterSpacing: '1px',
                        }}
                      >
                        ▶️ RESUME
                      </button>
                    )}
                    {(tx.status === 'ACTIVE' || tx.status === 'PAUSED') && (
                      <button
                        onClick={() => handleCancel(tx.id)}
                        style={{
                          flex: 1,
                          background: 'rgba(255,77,109,0.15)',
                          border: '1px solid rgba(255,77,109,0.3)',
                          color: '#FF4D6D',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          letterSpacing: '1px',
                        }}
                      >
                        🗑️ CANCEL
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
              <div style={{ fontSize: '10px', color: '#3A5070', letterSpacing: '3px', marginBottom: '16px' }}>ℹ️ ABOUT</div>
              <div style={{ fontSize: '13px', color: '#7A8FA6', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>Automate regular payments to save time. Choose your frequency and amount.</p>
                <p style={{ marginBottom: '0' }}>💡 Transfers execute automatically every 60 seconds if due.</p>
              </div>
            </div>
            <div style={{ background: 'rgba(245,200,66,0.04)', border: '1px solid rgba(245,200,66,0.12)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ fontSize: '10px', color: '#F5C842', letterSpacing: '2px', marginBottom: '10px' }}>🔒 SECURITY</div>
              <div style={{ fontSize: '13px', color: '#4A6080', lineHeight: '1.6' }}>All automated transfers are subject to the same security and balance checks as manual transfers.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
