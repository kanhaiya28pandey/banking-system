import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function EmployeeDashboard() {
  const { user } = useSelector((s: any) => s.auth)
  const [users, setUsers] = useState<any[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      const res = await api.get(`/user/by-role?requesterId=${user.id}&requesterRole=EMPLOYEE`)
      if (res.data.success) {
        setUsers(res.data.data || [])
      }

      const reqRes = await api.get(`/account-requests?userId=${user.id}&userRole=EMPLOYEE`)
      if (reqRes.data.success) {
        setAccountRequests(reqRes.data.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err.response?.status, err.message)
      toast.error('Failed to load data')
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.post(`/account-requests/${requestId}/approve?approverUserId=${user.id}&approverRole=EMPLOYEE`, {})
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
      await api.post(`/account-requests/${requestId}/reject?rejectorUserId=${user.id}&rejectorRole=EMPLOYEE&reason=${reason}`, {})
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
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>EMPLOYEE PANEL</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Customer <span style={{ color: '#00FFB2' }}>Operations</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage customer accounts and verify requests</div>
        </div>

        <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: '#3A5070', marginBottom: '8px' }}>CUSTOMERS</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#00FFB2' }}>{users.length}</div>
        </div>

        <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#00FFB2', marginBottom: '20px', letterSpacing: '1px' }}>PENDING VERIFICATIONS</div>
          {accountRequests.length === 0 ? (
            <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No pending verifications</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>USER ID</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT TYPE</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>AMOUNT</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTION</th>
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
      </main>
    </div>
  )
}
