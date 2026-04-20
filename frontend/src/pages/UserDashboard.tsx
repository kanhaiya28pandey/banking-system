import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function UserDashboard() {
  const { user } = useSelector((s: any) => s.auth)
  const [accounts, setAccounts] = useState<any[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      if (!user?.id) {
        console.error('User ID is missing:', user)
        toast.error('User ID not found. Please login again.')
        return
      }
      const res = await api.get(`/account/user/${user.id}`)
      if (res.data.data) {
        const accs = res.data.data
        setAccounts(accs)
        const total = accs.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0)
        setTotalBalance(total)
      }

      if (accounts.length > 0) {
        const txRes = await api.get(`/transaction/history?accountNumber=${accounts[0]?.accountNumber}`)
        if (txRes.data.data) {
          setRecentTransactions(txRes.data.data.slice(0, 5))
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err.response?.status, err.message)
      toast.error('Failed to load dashboard')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>CUSTOMER DASHBOARD</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Welcome, <span style={{ color: '#F5C842' }}>{user?.firstName}</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage your accounts and transactions</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(0,255,178,0.1), rgba(59,158,255,0.1))', border: '1px solid rgba(0,255,178,0.2)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>TOTAL BALANCE</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#00FFB2' }}>₹{totalBalance.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,200,66,0.1), rgba(255,77,109,0.1))', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>ACTIVE ACCOUNTS</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F5C842' }}>{accounts.length}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#F5C842', marginBottom: '16px' }}>YOUR ACCOUNTS</div>
            {accounts.map((acc) => (
              <div key={acc.id} style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.1)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '4px' }}>{acc.accountType}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#00FFB2' }}>{acc.accountNumber}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#00FFB2', marginTop: '8px' }}>₹{acc.balance.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#3B9EFF', marginBottom: '16px' }}>RECENT TRANSACTIONS</div>
            {recentTransactions.map((tx) => (
              <div key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#F0EFEA' }}>{tx.description}</div>
                    <div style={{ fontSize: '10px', color: '#4A6080', marginTop: '4px' }}>{new Date(tx.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: tx.type === 'CREDIT' ? '#00FFB2' : '#FF4D6D' }}>
                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
