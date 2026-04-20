import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function ManagerDashboard() {
  const { user } = useSelector((s: any) => s.auth)
  const [employees, setEmployees] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    try {
      // Get users and employees
      const res = await api.get(`/user/by-role?requesterId=${user.id}&requesterRole=MANAGER`)
      if (res.data.success) {
        const allUsers = res.data.data || []
        setEmployees(allUsers.filter((u: any) => u.role === 'EMPLOYEE'))
        setUsers(allUsers.filter((u: any) => u.role === 'USER'))
      }

      // Get pending account requests
      const reqRes = await api.get(`/account-requests?userId=${user.id}&userRole=MANAGER`)
      if (reqRes.data.success) {
        setAccountRequests(reqRes.data.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err.response?.status, err.message)
      toast.error('Failed to load data')
    }
  }

  const handleCreateEmployee = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.firstName) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await api.post(`/user/create-employee?creatorId=${user.id}`, formData)
      if (res.data.success) {
        toast.success('Employee created successfully')
        setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '' })
        setShowCreateModal(false)
        loadData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create employee')
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.post(`/account-requests/${requestId}/approve?approverUserId=${user.id}&approverRole=MANAGER`, {})
      toast.success('Account approved')
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await api.post(`/account-requests/${requestId}/reject?rejectorUserId=${user.id}&rejectorRole=MANAGER&reason=${reason}`, {})
      toast.success('Account rejected')
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>MANAGER PANEL</div>
            <div style={{ fontSize: '34px', fontWeight: '700' }}>Branch <span style={{ color: '#3B9EFF' }}>Management</span></div>
            <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage employees and customer accounts</div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3B9EFF, #00FFB2)',
              border: 'none',
              color: '#060A12',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px'
            }}
          >
            + Create Employee
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>EMPLOYEES</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#00FFB2' }}>{employees.length}</div>
          </div>
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>CUSTOMERS</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F5C842' }}>{users.length}</div>
          </div>
        </div>

        {/* Pending Account Requests */}
        <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#3B9EFF', marginBottom: '20px', letterSpacing: '1px' }}>PENDING ACCOUNT REQUESTS</div>
          {accountRequests.length === 0 ? (
            <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No pending requests</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>USER ID</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT TYPE</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>AMOUNT</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {accountRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <td style={{ padding: '12px', fontSize: '12px' }}>{req.userId}</td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>{req.accountType}</td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>₹{req.initialDeposit}</td>
                      <td style={{ padding: '12px', fontSize: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveRequest(req.id)} style={{ background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.3)', color: '#00FFB2', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' }}>Approve</button>
                        <button onClick={() => handleRejectRequest(req.id)} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '10px' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Employee Modal */}
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
              border: '1px solid rgba(59,158,255,0.3)',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#3B9EFF' }}>Create New Employee</div>

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
                  onClick={handleCreateEmployee}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #3B9EFF, #00FFB2)',
                    border: 'none',
                    color: '#060A12',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Create Employee
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
