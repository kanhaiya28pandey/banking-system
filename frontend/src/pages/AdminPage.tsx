import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function AdminPage() {
  const { token } = useSelector((s: any) => s.auth)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const headers = { headers: { Authorization: `Bearer ${token}` } }

  const fetchUsers = async () => {
    try {
      const res = await api.get('http://localhost:8082/api/user/all', headers)
      setUsers(res.data.data || [])
    } catch { toast.error('Failed to load users') }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBlock = async (id: string, status: string) => {
    try {
      await api.put(`/user/${status === 'ACTIVE' ? 'block' : 'unblock'}/${id}`, {}, headers)
      toast.success('Status updated!'); fetchUsers()
    } catch { toast.error('Failed') }
  }

  const roleColor: Record<string, string> = { ADMIN: '#F5C842', EMPLOYEE: '#3B9EFF', CUSTOMER: '#00FFB2' }
  const stats = [
    { label: 'Total Users', value: users.length, color: '#F5C842' },
    { label: 'Active', value: users.filter(u => u.status === 'ACTIVE').length, color: '#00FFB2' },
    { label: 'Blocked', value: users.filter(u => u.status === 'BLOCKED').length, color: '#FF4D6D' },
    { label: 'Staff', value: users.filter(u => u.role !== 'CUSTOMER').length, color: '#3B9EFF' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>ADMIN MODULE</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Control <span style={{ color: '#F5C842' }}>Panel</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage users, roles, and access</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
              <div style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', marginBottom: '10px' }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '2px' }}>USER REGISTRY</div>
            <span style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{users.length} TOTAL</span>
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#4A6080', fontSize: '12px', letterSpacing: '2px' }}>LOADING...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
              <thead>
                <tr>{['User','Email','Role','Status','Action'].map(h => <th key={h} style={{ textAlign: 'left' as const, fontSize: '10px', color: '#4A6080', letterSpacing: '2px', padding: '0 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${roleColor[u.role]||'#F5C842'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: roleColor[u.role]||'#F5C842' }}>{u.name?.charAt(0)||u.email?.charAt(0)}</div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{u.name||'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4A6080' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: `${roleColor[u.role]||'#F5C842'}15`, color: roleColor[u.role]||'#F5C842', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>{u.role}</span></td>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: u.status==='ACTIVE'?'rgba(0,255,178,0.12)':'rgba(255,77,109,0.12)', color: u.status==='ACTIVE'?'#00FFB2':'#FF4D6D', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>● {u.status}</span></td>
                    <td style={{ padding: '14px 16px' }}>
                      {u.role !== 'ADMIN' && <button onClick={() => toggleBlock(u.id, u.status)} style={{ background: u.status==='ACTIVE'?'rgba(255,77,109,0.1)':'rgba(0,255,178,0.1)', border: `1px solid ${u.status==='ACTIVE'?'rgba(255,77,109,0.25)':'rgba(0,255,178,0.25)'}`, color: u.status==='ACTIVE'?'#FF4D6D':'#00FFB2', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>{u.status==='ACTIVE'?'BLOCK':'UNBLOCK'}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
