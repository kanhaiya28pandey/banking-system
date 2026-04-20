import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function EmployeeDashboard() {
  const { user } = useSelector((s: any) => s.auth)
  const [activeTab, setActiveTab] = useState<'customers' | 'pending' | 'transactions'>('customers')
  const [customers, setCustomers] = useState<any[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([])
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [editData, setEditData] = useState<any>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: ''
  })

  useEffect(() => {
    if (user?.id) loadAllData()
  }, [user?.id])

  const loadAllData = async () => {
    try {
      // Get all customers
      const custRes = await api.get(`/user/employees/all-customers`)
      if (custRes.data.success) {
        setCustomers(custRes.data.data || [])
      }

      // Get pending verifications
      const pendingRes = await api.get(`/user/employees/pending-verifications`)
      if (pendingRes.data.success) {
        setPendingAccounts(pendingRes.data.data || [])
      }

      // Get all transactions
      const txRes = await api.get(`/transaction/employee/all-transactions`)
      if (txRes.data.success) {
        setAllTransactions(txRes.data.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err.response?.status, err.message)
      toast.error('Failed to load data')
    }
  }

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setEditData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pinCode: customer.pinCode || ''
    })
    setShowEditModal(true)
  }

  const handleSaveCustomer = async () => {
    try {
      const res = await api.put(
        `/user/employees/update-customer/${selectedCustomer.id}?employeeId=${user.id}`,
        editData
      )
      if (res.data.success) {
        toast.success('Customer information updated')
        setShowEditModal(false)
        loadAllData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const handleVerifyAccount = async (userId: string) => {
    try {
      const res = await api.post(
        `/user/employees/verify-account/${userId}?employeeId=${user.id}`,
        {}
      )
      if (res.data.success) {
        toast.success('Account verified successfully')
        loadAllData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify')
    }
  }

  const handleDisableAccount = async (userId: string) => {
    if (!window.confirm('Are you sure you want to disable this account?')) return
    try {
      const res = await api.post(
        `/user/employees/disable-account/${userId}?employeeId=${user.id}`,
        {}
      )
      if (res.data.success) {
        toast.success('Account disabled')
        loadAllData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable')
    }
  }

  const handleEnableAccount = async (userId: string) => {
    try {
      const res = await api.post(
        `/user/employees/enable-account/${userId}?employeeId=${user.id}`,
        {}
      )
      if (res.data.success) {
        toast.success('Account enabled')
        loadAllData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable')
    }
  }

  const getUserTransactions = (userId: string) => {
    return allTransactions.filter(tx => tx.fromAccount === userId || tx.toAccount === userId)
  }

  const handleViewTransactions = (customer: any) => {
    setSelectedCustomer(customer)
    setShowTransactionsModal(true)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>EMPLOYEE PANEL</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Customer <span style={{ color: '#00FFB2' }}>Management</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage customers, verify accounts, and monitor transactions</div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('customers')}
            style={{
              background: activeTab === 'customers' ? 'rgba(0,255,178,0.1)' : 'transparent',
              border: activeTab === 'customers' ? '1px solid rgba(0,255,178,0.3)' : '1px solid transparent',
              color: activeTab === 'customers' ? '#00FFB2' : '#4A6080',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px'
            }}
          >
            ALL CUSTOMERS ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: activeTab === 'pending' ? 'rgba(245,200,66,0.1)' : 'transparent',
              border: activeTab === 'pending' ? '1px solid rgba(245,200,66,0.3)' : '1px solid transparent',
              color: activeTab === 'pending' ? '#F5C842' : '#4A6080',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px'
            }}
          >
            PENDING VERIFICATION ({pendingAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              background: activeTab === 'transactions' ? 'rgba(59,158,255,0.1)' : 'transparent',
              border: activeTab === 'transactions' ? '1px solid rgba(59,158,255,0.3)' : '1px solid transparent',
              color: activeTab === 'transactions' ? '#3B9EFF' : '#4A6080',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px'
            }}
          >
            TRANSACTION LOGS ({allTransactions.length})
          </button>
        </div>

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#00FFB2', marginBottom: '20px' }}>CUSTOMER DIRECTORY</div>
            {customers.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No customers</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>NAME</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>EMAIL</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>PHONE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cust) => (
                      <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{cust.firstName} {cust.lastName}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{cust.email}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{cust.phone}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          <span style={{
                            background: cust.accountStatus === 'VERIFIED' ? 'rgba(0,255,178,0.2)' : cust.accountStatus === 'PENDING_VERIFICATION' ? 'rgba(245,200,66,0.2)' : 'rgba(255,77,109,0.2)',
                            color: cust.accountStatus === 'VERIFIED' ? '#00FFB2' : cust.accountStatus === 'PENDING_VERIFICATION' ? '#F5C842' : '#FF4D6D',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            {cust.accountStatus || 'PENDING_VERIFICATION'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleEditCustomer(cust)}
                            style={{
                              background: 'rgba(59,158,255,0.1)',
                              border: '1px solid rgba(59,158,255,0.3)',
                              color: '#3B9EFF',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '9px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewTransactions(cust)}
                            style={{
                              background: 'rgba(0,255,178,0.1)',
                              border: '1px solid rgba(0,255,178,0.3)',
                              color: '#00FFB2',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '9px'
                            }}
                          >
                            Transactions
                          </button>
                          {cust.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleDisableAccount(cust.id)}
                              style={{
                                background: 'rgba(255,77,109,0.1)',
                                border: '1px solid rgba(255,77,109,0.3)',
                                color: '#FF4D6D',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '9px'
                              }}
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnableAccount(cust.id)}
                              style={{
                                background: 'rgba(0,255,178,0.1)',
                                border: '1px solid rgba(0,255,178,0.3)',
                                color: '#00FFB2',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '9px'
                              }}
                            >
                              Enable
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PENDING VERIFICATION TAB */}
        {activeTab === 'pending' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#F5C842', marginBottom: '20px' }}>PENDING ACCOUNT VERIFICATIONS</div>
            {pendingAccounts.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No pending verifications</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>NAME</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>EMAIL</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT TYPE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>INITIAL DEPOSIT</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAccounts.map((acc) => (
                      <tr key={acc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{acc.firstName} {acc.lastName}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{acc.email}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{acc.accountType}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>₹{acc.initialDeposit}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          <button
                            onClick={() => handleVerifyAccount(acc.id)}
                            style={{
                              background: 'linear-gradient(135deg, #00FFB2, #00DD99)',
                              border: 'none',
                              color: '#060A12',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '10px'
                            }}
                          >
                            Verify Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#3B9EFF', marginBottom: '20px' }}>SYSTEM TRANSACTION LOGS</div>
            {allTransactions.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No transactions</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>FROM</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>TO</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>AMOUNT</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>TYPE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{tx.fromAccount}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{tx.toAccount}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>₹{tx.amount}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{tx.type}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          <span style={{ color: tx.status === 'SUCCESS' ? '#00FFB2' : '#FF4D6D' }}>{tx.status}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '11px', color: '#4A6080' }}>
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && selectedCustomer && (
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
              border: '1px solid rgba(0,255,178,0.3)',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#00FFB2' }}>
                Edit {selectedCustomer.firstName}'s Information
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>First Name</label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
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
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Phone</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
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
                  <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>Address</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>City</label>
                    <input
                      type="text"
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>State</label>
                    <input
                      type="text"
                      value={editData.state}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '12px', color: '#3A5070', marginBottom: '6px' }}>PIN Code</label>
                    <input
                      type="text"
                      value={editData.pinCode}
                      onChange={(e) => setEditData({ ...editData, pinCode: e.target.value })}
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
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleSaveCustomer}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #00FFB2, #00DD99)',
                    border: 'none',
                    color: '#060A12',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700'
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
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

        {/* TRANSACTIONS MODAL */}
        {showTransactionsModal && selectedCustomer && (
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
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#3B9EFF' }}>
                {selectedCustomer.firstName}'s Transaction History
              </div>

              {getUserTransactions(selectedCustomer.id).length === 0 ? (
                <div style={{ color: '#4A6080', textAlign: 'center', padding: '20px' }}>No transactions</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>TYPE</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>AMOUNT</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>STATUS</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUserTransactions(selectedCustomer.id).map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <td style={{ padding: '12px', fontSize: '12px' }}>{tx.type}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>₹{tx.amount}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>
                            <span style={{ color: tx.status === 'SUCCESS' ? '#00FFB2' : '#FF4D6D' }}>{tx.status}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '11px', color: '#4A6080' }}>
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => setShowTransactionsModal(false)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#F0EFEA',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  marginTop: '24px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
