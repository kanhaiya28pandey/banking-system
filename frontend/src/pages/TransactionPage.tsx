import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import axios from 'axios'

type Tab = 'deposit' | 'withdraw' | 'transfer' | 'history'

export default function TransactionPage() {
  const { user, token } = useSelector((s: any) => s.auth)
  const [tab, setTab] = useState<Tab>('deposit')
  const [amount, setAmount] = useState('')
  const [fromAcc, setFrom] = useState('')
  const [toAcc, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedAcc, setSelectedAcc] = useState('')
  const [histLoading, setHistLoading] = useState(false)
  const headers = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    if (!user?.id) return
    axios.get(`http://localhost:8080/api/account/user/${user.id}`, headers).then(res => {
      const accs = res.data.data || []
      setAccounts(accs)
      if (accs.length > 0) { setSelectedAcc(accs[0].accountNumber); setFrom(accs[0].accountNumber) }
    }).catch(() => {})
  }, [user])

  const fetchHistory = async (accNum: string) => {
    if (!accNum) return
    setHistLoading(true)
    try {
      const res = await axios.get(`http://localhost:8080/api/transaction/history/${accNum}`, headers)
      setHistory(res.data.data || [])
    } catch { toast.error('Failed to load history') }
    setHistLoading(false)
  }

  useEffect(() => { if (tab === 'history' && selectedAcc) fetchHistory(selectedAcc) }, [tab, selectedAcc])

  const refreshAccounts = async () => {
    const res = await axios.get(`http://localhost:8080/api/account/user/${user.id}`, headers)
    setAccounts(res.data.data || [])
  }

  const handleDeposit = async () => {
    if (!amount || !selectedAcc) { toast.error('Select account and enter amount'); return }
    setLoading(true)
    try {
      await axios.post(`http://localhost:8080/api/transaction/deposit?accountNumber=${selectedAcc}&amount=${amount}`, {}, headers)
      toast.success(`₹${amount} deposited!`); setAmount(''); refreshAccounts()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Deposit failed') }
    setLoading(false)
  }

  const handleWithdraw = async () => {
    if (!amount || !selectedAcc) { toast.error('Select account and enter amount'); return }
    setLoading(true)
    try {
      await axios.post(`http://localhost:8080/api/transaction/withdraw?accountNumber=${selectedAcc}&amount=${amount}`, {}, headers)
      toast.success(`₹${amount} withdrawn!`); setAmount(''); refreshAccounts()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Insufficient balance') }
    setLoading(false)
  }

  const handleTransfer = async () => {
    if (!fromAcc || !toAcc || !amount) { toast.error('Fill all fields'); return }
    if (fromAcc === toAcc) { toast.error('Same account'); return }
    setLoading(true)
    try {
      await axios.post('http://localhost:8080/api/transaction/transfer', { fromAccount: fromAcc, toAccount: toAcc, amount: parseFloat(amount), description: 'Transfer' }, headers)
      toast.success(`₹${amount} transferred!`); setAmount(''); setTo(''); refreshAccounts()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Transfer failed') }
    setLoading(false)
  }

  const tabs = [
    { key: 'deposit' as Tab, label: 'Deposit', icon: '↓', color: '#00FFB2' },
    { key: 'withdraw' as Tab, label: 'Withdraw', icon: '↑', color: '#FF4D6D' },
    { key: 'transfer' as Tab, label: 'Transfer', icon: '⇄', color: '#3B9EFF' },
    { key: 'history' as Tab, label: 'History', icon: '◈', color: '#F5C842' },
  ]
  const activeTab = tabs.find(t => t.key === tab)!
  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const inp: any = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 18px', color: '#F0EFEA', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>TRANSACTION MODULE</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Money <span style={{ color: '#F5C842' }}>Operations</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Deposit · Withdraw · Transfer — Atomic & Secure</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(10,18,32,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '5px', marginBottom: '24px' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: tab === t.key ? `linear-gradient(135deg, ${t.color}CC, ${t.color}88)` : 'transparent', color: tab === t.key ? (t.key === 'deposit' || t.key === 'history' ? '#060A12' : 'white') : '#7A8FA6', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab !== 'history' && tab !== 'transfer' && accounts.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>SELECT ACCOUNT</label>
                <select value={selectedAcc} onChange={e => setSelectedAcc(e.target.value)} style={inp}>
                  {accounts.map(acc => <option key={acc.id} value={acc.accountNumber}>{acc.accountType} — {acc.accountNumber} — ₹{(acc.balance||0).toLocaleString('en-IN')}</option>)}
                </select>
              </div>
            )}

            {tab !== 'history' && (
              <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${activeTab.color}12`, border: `1px solid ${activeTab.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: activeTab.color }}>{activeTab.icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: activeTab.color, letterSpacing: '2px' }}>{activeTab.label.toUpperCase()} MONEY</div>
                    <div style={{ fontSize: '13px', color: '#4A6080', marginTop: '3px' }}>{tab === 'deposit' ? 'Add funds' : tab === 'withdraw' ? 'Withdraw cash' : 'Send to another account'}</div>
                  </div>
                </div>

                {tab === 'transfer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>FROM</label>
                      <select value={fromAcc} onChange={e => setFrom(e.target.value)} style={inp}>
                        {accounts.map(acc => <option key={acc.id} value={acc.accountNumber}>{acc.accountType} — {acc.accountNumber}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>TO ACCOUNT</label>
                      <input style={inp} value={toAcc} onChange={e => setTo(e.target.value)} placeholder="Enter account number" />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>AMOUNT (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={{ ...inp, paddingLeft: '46px', fontSize: '26px', fontWeight: '800', color: activeTab.color }} />
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#4A6080', fontWeight: '700' }}>₹</span>
                  </div>
                </div>

                <button disabled={loading} onClick={tab === 'deposit' ? handleDeposit : tab === 'withdraw' ? handleWithdraw : handleTransfer} style={{ width: '100%', border: 'none', borderRadius: '14px', padding: '17px', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${activeTab.color}, ${activeTab.color}BB)`, color: tab === 'withdraw' || tab === 'transfer' ? 'white' : '#060A12', boxShadow: `0 8px 28px ${activeTab.color}40`, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'PROCESSING...' : `EXECUTE ${tab.toUpperCase()} →`}
                </button>
              </div>
            )}

            {tab === 'history' && (
              <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5C842', letterSpacing: '2px' }}>TRANSACTION HISTORY</div>
                  <select value={selectedAcc} onChange={e => { setSelectedAcc(e.target.value); fetchHistory(e.target.value) }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F0EFEA', fontSize: '12px', outline: 'none' }}>
                    {accounts.map(acc => <option key={acc.id} value={acc.accountNumber}>{acc.accountType} — {acc.accountNumber}</option>)}
                  </select>
                </div>
                {histLoading && <div style={{ textAlign: 'center', padding: '40px', color: '#4A6080' }}>LOADING...</div>}
                {!histLoading && history.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#4A6080' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>NO TRANSACTIONS YET</div>}
                {!histLoading && history.map((tx: any, i: number) => {
                  const isCredit = tx.type === 'CREDIT'
                  const color = isCredit ? '#00FFB2' : tx.type === 'DEBIT' ? '#FF4D6D' : '#3B9EFF'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color }}>{isCredit ? '↓' : tx.type === 'DEBIT' ? '↑' : '⇄'}</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{tx.description || tx.type}</div>
                          <div style={{ fontSize: '11px', color: '#3A5070', marginTop: '3px' }}>{tx.date ? new Date(tx.date).toLocaleString('en-IN') : ''}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color }}>{isCredit ? '+' : '-'}₹{(tx.amount||0).toLocaleString('en-IN')}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
              <div style={{ fontSize: '10px', color: '#3A5070', letterSpacing: '3px', marginBottom: '16px' }}>LIVE BALANCES</div>
              {accounts.length === 0 ? <div style={{ color: '#3A5070', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No accounts</div> :
                accounts.map((acc, i) => (
                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < accounts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#7A8FA6' }}>{acc.accountType}</div>
                      <div style={{ fontSize: '11px', color: '#3A5070', fontFamily: 'monospace' }}>...{acc.accountNumber?.slice(-4)}</div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: i === 0 ? '#F5C842' : '#3B9EFF' }}>₹{(acc.balance||0).toLocaleString('en-IN')}</div>
                  </div>
                ))
              }
              {accounts.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(245,200,66,0.12)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#7A8FA6' }}>Total</span>
                  <span style={{ fontSize: '17px', fontWeight: '800', color: '#00FFB2' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div style={{ background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.12)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ fontSize: '10px', color: '#00FFB2', letterSpacing: '2px', marginBottom: '10px' }}>🔐 SECURITY</div>
              <div style={{ fontSize: '13px', color: '#4A6080', lineHeight: '1.6' }}>All transactions are encrypted and atomic. Balance checks enforced server-side.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
