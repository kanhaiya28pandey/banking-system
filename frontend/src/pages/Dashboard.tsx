import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import api from '../api/axiosInstance'

export default function Dashboard() {
  const { user, token } = useSelector((s: any) => s.auth)
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const headers = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    if (!user?.id) return
    api.get(`/account/user/${user.id}`, headers)
      .then(res => setAccounts(res.data.data || []))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (accounts.length === 0) return
    Promise.all(accounts.map((acc: any) =>
      api.get(`/transaction/history/${acc.accountNumber}`, headers)
        .then(r => r.data.data || [])
        .catch(() => [])
    )).then(results => {
      const all = results.flat().sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setTransactions(all)
    })
  }, [accounts])

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const totalCredit  = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)
  const totalDebit   = transactions.filter(t => t.type !== 'CREDIT').reduce((s, t) => s + t.amount, 0)

  // BAR CHART — last 6 months income vs expense
  const monthlyData = () => {
    const months: Record<string, { month: string; income: number; expense: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      months[key] = {
        month: d.toLocaleString('default', { month: 'short' }),
        income: 0, expense: 0
      }
    }
    transactions.forEach((tx: any) => {
      if (!tx.date) return
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!months[key]) return
      if (tx.type === 'CREDIT') months[key].income += tx.amount
      else months[key].expense += tx.amount
    })
    return Object.values(months)
  }

  // PIE CHART — transaction type breakdown
  const pieData = [
    { name: 'Credit', value: transactions.filter(t => t.type === 'CREDIT').length, color: '#00FFB2' },
    { name: 'Debit', value: transactions.filter(t => t.type === 'DEBIT').length, color: '#FF4D6D' },
    { name: 'Transfer', value: transactions.filter(t => t.type === 'TRANSFER').length, color: '#3B9EFF' },
  ].filter(d => d.value > 0)

  // LINE CHART — balance trend (last 7 tx)
  const lineTrend = () => {
    let running = totalBalance
    const reversed = [...transactions].reverse().slice(-7)
    return reversed.map((tx: any, i) => {
      const val = running
      running += tx.type === 'CREDIT' ? tx.amount : -tx.amount
      return { name: i + 1, balance: Math.max(0, val) }
    })
  }

  const stats = [
    { label: 'Total Balance', value: `₹${totalBalance.toLocaleString('en-IN')}`, icon: '💰', color: '#F5C842' },
    { label: 'Active Accounts', value: accounts.length, icon: '🏦', color: '#00FFB2' },
    { label: 'Total Income', value: `₹${totalCredit.toLocaleString('en-IN')}`, icon: '↓', color: '#00FFB2' },
    { label: 'Total Spent', value: `₹${totalDebit.toLocaleString('en-IN')}`, icon: '↑', color: '#FF4D6D' },
  ]

  const quick = [
    { label: 'DEPOSIT', path: '/transactions', color: '#00FFB2', icon: '↓' },
    { label: 'WITHDRAW', path: '/transactions', color: '#FF4D6D', icon: '↑' },
    { label: 'TRANSFER', path: '/transactions', color: '#3B9EFF', icon: '⇄' },
    { label: 'ATM', path: '/atm', color: '#F5C842', icon: '◉' },
  ]

  const chartTooltipStyle = {
    background: '#0D1829', border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: '10px', color: '#F0EFEA', fontSize: '12px'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>WELCOME BACK</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>
            Good Morning, <span style={{ color: '#F5C842' }}>{user?.name || user?.email?.split('@')[0] || 'User'}</span> 👋
          </div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', marginBottom: '8px' }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '20px' }}>

          {/* BAR CHART */}
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>Monthly Overview</div>
                <div style={{ fontSize: '12px', color: '#4A6080', marginTop: '2px' }}>Income vs Expenses — Last 6 months</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#00FFB2' }} />
                  <span style={{ color: '#7A8FA6' }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#FF4D6D' }} />
                  <span style={{ color: '#7A8FA6' }}>Expense</span>
                </div>
              </div>
            </div>
            {transactions.length === 0 ? (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#3A5070' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '12px', letterSpacing: '2px' }}>NO DATA YET</div>
                <div style={{ fontSize: '12px', marginTop: '6px' }}>Make transactions to see charts</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData()} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#7A8FA6', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  <Bar dataKey="income" fill="#00FFB2" radius={[4,4,0,0]} maxBarSize={28} />
                  <Bar dataKey="expense" fill="#FF4D6D" radius={[4,4,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* PIE CHART */}
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Transaction Types</div>
            <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '20px' }}>Breakdown by category</div>
            {pieData.length === 0 ? (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#3A5070' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🥧</div>
                <div style={{ fontSize: '12px', letterSpacing: '2px' }}>NO DATA YET</div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontSize: '12px', color: '#7A8FA6' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: d.color }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CHARTS ROW 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* LINE CHART — balance trend */}
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Balance Trend</div>
            <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '20px' }}>Last transactions</div>
            {transactions.length === 0 ? (
              <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#3A5070' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📈</div>
                <div style={{ fontSize: '12px', letterSpacing: '2px' }}>NO DATA YET</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={lineTrend()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7A8FA6', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Balance']} />
                  <Line type="monotone" dataKey="balance" stroke="#F5C842" strokeWidth={2} dot={{ fill: '#F5C842', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* RECENT TRANSACTIONS */}
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Recent Transactions</div>
              <Link to="/transactions" style={{ fontSize: '12px', color: '#F5C842', textDecoration: 'none' }}>View all →</Link>
            </div>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#3A5070' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                <div style={{ fontSize: '12px', letterSpacing: '2px' }}>NO TRANSACTIONS YET</div>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx: any, i: number) => {
                const isCredit = tx.type === 'CREDIT'
                const color = isCredit ? '#00FFB2' : tx.type === 'DEBIT' ? '#FF4D6D' : '#3B9EFF'
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color, flexShrink: 0 }}>
                        {isCredit ? '↓' : tx.type === 'DEBIT' ? '↑' : '⇄'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{tx.description || tx.type}</div>
                        <div style={{ fontSize: '11px', color: '#3A5070' }}>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : ''}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color }}>{isCredit ? '+' : '-'}₹{(tx.amount||0).toLocaleString('en-IN')}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ACCOUNTS + QUICK ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>My Accounts</div>
              <Link to="/accounts" style={{ fontSize: '12px', color: '#F5C842', textDecoration: 'none' }}>Manage →</Link>
            </div>
            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#3A5070' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏦</div>
                <div style={{ fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>NO ACCOUNTS</div>
                <Link to="/accounts" style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>+ CREATE ACCOUNT</Link>
              </div>
            ) : (
              accounts.map((acc, i) => (
                <div key={acc.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px 16px', marginBottom: i < accounts.length - 1 ? '10px' : 0, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: i === 0 ? '#F5C842' : '#3B9EFF', letterSpacing: '2px', marginBottom: '4px' }}>{acc.accountType}</div>
                      <div style={{ fontSize: '11px', color: '#3A5070', fontFamily: 'monospace' }}>...{acc.accountNumber?.slice(-6)}</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: i === 0 ? '#F5C842' : '#3B9EFF' }}>₹{(acc.balance||0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {quick.map((a, i) => (
                <Link key={i} to={a.path} style={{ textDecoration: 'none' }}>
                  <div style={{ background: `${a.color}10`, border: `1px solid ${a.color}25`, borderRadius: '14px', padding: '18px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '24px', color: a.color, marginBottom: '8px' }}>{a.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: a.color, letterSpacing: '1.5px' }}>{a.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}