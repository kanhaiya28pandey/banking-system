import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function AdminDashboard() {
  const { user } = useSelector((s: any) => s.auth)
  const [managers, setManagers] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    branch: ''
  })

  useEffect(() => {
    if (user?.id) loadUsers()
  }, [user?.id])

  const loadUsers = async () => {
    try {
      if (!user?.id) {
        console.error('User ID is missing:', user)
        toast.error('User ID not found. Please login again.')
        return
      }
      const res = await api.get(`/user/by-role?requesterId=${user.id}&requesterRole=ADMIN`)
      if (res.data.success) {
        const allUsers = res.data.data || []
        setManagers(allUsers.filter((u: any) => u.role === 'MANAGER'))
        setEmployees(allUsers.filter((u: any) => u.role === 'EMPLOYEE'))
        setUsers(allUsers.filter((u: any) => u.role === 'USER'))
      }
    } catch (err: any) {
      console.error('Failed to load users:', err.response?.status, err.message)
      toast.error('Failed to load users')
    }
  }

  const handleCreateManager = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.branch) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await api.post(`/user/create-manager?creatorId=${user.id}`, formData)
      if (res.data.success) {
        toast.success('Manager created successfully')
        setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', branch: '' })
        setShowCreateModal(false)
        loadUsers()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create manager')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>ADMIN PANEL</div>
            <div style={{ fontSize: '34px', fontWeight: '700' }}>System <span style={{ color: '#F5C842' }}>Administration</span></div>
            <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage managers, employees, and users</div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #F5C842, #FFD700)',
              border: 'none',
              color: '#060A12',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px'
            }}
          >
            + Create Manager
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {/* Stats Cards */}
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>TOTAL MANAGERS</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3B9EFF' }}>{managers.length}</div>
          </div>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>TOTAL EMPLOYEES</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#00FFB2' }}>{employees.length}</div>
          </div>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>TOTAL USERS</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F5C842' }}>{users.length}</div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#F5C842', marginBottom: '20px', letterSpacing: '1px' }}>ALL USERS & STAFF</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px', fontWeight: '600' }}>NAME</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px', fontWeight: '600' }}>ROLE</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px', fontWeight: '600' }}>EMAIL</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px', fontWeight: '600' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[...managers, ...employees, ...users].map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <td style={{ padding: '12px', fontSize: '12px' }}>{u.firstName} {u.lastName}</td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      <span style={{ background: u.role === 'MANAGER' ? 'rgba(59,158,255,0.2)' : u.role === 'EMPLOYEE' ? 'rgba(0,255,178,0.2)' : 'rgba(245,200,66,0.2)', color: u.role === 'MANAGER' ? '#3B9EFF' : u.role === 'EMPLOYEE' ? '#00FFB2' : '#F5C842', padding: '4px 8px', borderRadius: '4px' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{u.email}</td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      <span style={{ color: u.status === 'ACTIVE' ? '#00FFB2' : '#FF4D6D' }}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Manager Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0A1220',
              border: '1px solid rgba(245,200,66,0.3)',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#F5C842' }}>Create New Manager</div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>First Name *</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Username *</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Email *</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Password *</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Branch *</label>
                  <input
                    type="text"
                    placeholder="Branch Name"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#F0EFEA',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleCreateManager}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #F5C842, #FFD700)',
                    border: 'none',
                    color: '#060A12',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Create Manager
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#F0EFEA',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
