import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function EmployeeDashboard() {
  const { user, token } = useSelector((s: any) => s.auth)
  const [activeTab, setActiveTab] = useState<'customers' | 'pending' | 'transactions' | 'accountRequests' | 'abandoned'>('customers')

  // Debug: Check token on mount
  useEffect(() => {
    console.log('Employee Dashboard - Token from Redux:', token)
    console.log('Employee Dashboard - Token from localStorage:', localStorage.getItem('token'))
    if (!token && !localStorage.getItem('token')) {
      toast.error('Session lost. Please login again.')
    }
  }, [token])

  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingAccounts, setPendingAccounts] = useState<any[]>([])
  const [accountRequests, setAccountRequests] = useState<any[]>([])
  const [abandonedProfiles, setAbandonedProfiles] = useState<any[]>([])
  const [allTransactions, setAllTransactions] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [transactionCounts, setTransactionCounts] = useState<{ [key: string]: number }>({})
  const [modalTransactions, setModalTransactions] = useState<any[]>([])
  const [customerAccounts, setCustomerAccounts] = useState<{ [key: string]: any[] }>({})
  const [editData, setEditData] = useState<any>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    income: '',
    education: '',
    occupation: '',
    aadhaar: '',
    pan: '',
    seniorCitizen: false,
    existingCustomer: false
  })

  useEffect(() => {
    if (user?.id) loadAllData()
  }, [user?.id])

  useEffect(() => {
    // Load customer accounts when customers change
    loadCustomerAccounts()
  }, [customers])

  const loadCustomerAccounts = async () => {
    const accountsMap: { [key: string]: any[] } = {}
    for (const customer of customers) {
      try {
        const accRes = await api.get(`/account/user/${customer.id}`)
        if (accRes.data.success) {
          accountsMap[customer.id] = accRes.data.data || []
        }
      } catch (err) {
        console.error(`Failed to load accounts for customer ${customer.id}:`, err)
      }
    }
    setCustomerAccounts(accountsMap)
  }

  useEffect(() => {
    // Filter customers based on search term
    const filtered = customers.filter(c =>
      c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  useEffect(() => {
    // Load transaction counts when transaction tab is active or data changes
    if (activeTab === 'transactions') {
      loadTransactionCounts()
    }
  }, [activeTab, customers, allTransactions])

  const loadTransactionCounts = async () => {
    const counts: { [key: string]: number } = {}
    for (const customer of customers) {
      const txs = await getUserTransactions(customer.id)
      counts[customer.id] = txs.length
    }
    setTransactionCounts(counts)
  }

  const loadAllData = async () => {
    try {
      const custRes = await api.get(`/user/employees/all-customers`)
      if (custRes.data.success) {
        // Backend now returns only customers with accounts
        setCustomers(custRes.data.data || [])
        setFilteredCustomers(custRes.data.data || [])
      }

      const pendingRes = await api.get(`/user/employees/pending-verifications`)
      if (pendingRes.data.success) {
        setPendingAccounts(pendingRes.data.data || [])
      }

      // Fetch account creation requests
      const accountReqRes = await api.get(`/account-request/pending`)
      if (accountReqRes.data.success) {
        setAccountRequests(accountReqRes.data.data || [])
      }

      // Fetch abandoned profiles (REGISTERED but no accounts)
      const abandonedRes = await api.get(`/user/abandoned-profiles`)
      if (abandonedRes.data.success) {
        setAbandonedProfiles(abandonedRes.data.data || [])
      }

      const txRes = await api.get(`/transaction/employee/all-transactions`)
      if (txRes.data.success) {
        setAllTransactions(txRes.data.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
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
      pinCode: customer.pinCode || '',
      income: customer.incomeRange || '',
      education: customer.educationalQualification || '',
      occupation: customer.occupation || '',
      aadhaar: customer.aadhaarNumber || '',
      pan: customer.panNumber || '',
      seniorCitizen: customer.seniorCitizen || false,
      existingCustomer: customer.existingAccountHolder || false
    })
    setShowEditModal(true)
  }

  const handleSaveCustomer = async () => {
    try {
      const updatePayload = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: editData.phone,
        address: editData.address,
        city: editData.city,
        state: editData.state,
        pinCode: editData.pinCode,
        incomeRange: editData.income,
        educationalQualification: editData.education,
        occupation: editData.occupation,
        aadhaarNumber: editData.aadhaar,
        panNumber: editData.pan,
        seniorCitizen: editData.seniorCitizen,
        existingAccountHolder: editData.existingCustomer
      }

      const res = await api.put(
        `/user/employees/update-customer/${selectedCustomer.id}?employeeId=${user.id}`,
        updatePayload
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
      await api.post(`/user/employees/verify-account/${userId}?employeeId=${user.id}`, {})
      toast.success('Account verified successfully')
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify')
    }
  }

  const handleApproveAccountRequest = async (requestId: string) => {
    if (!token) {
      toast.error('No authentication token. Please login again.')
      return
    }
    try {
      console.log('Approving with token:', token.substring(0, 20) + '...')
      await api.post(`/account-request/approve/${requestId}?approverId=${user.id}&approverRole=${user.role}`, {})
      toast.success('✅ Account request approved! Account created.')
      loadAllData()
    } catch (err: any) {
      console.error('Approve error:', err)
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.')
      } else {
        toast.error(err.response?.data?.message || 'Failed to approve')
      }
    }
  }

  const handleRejectAccountRequest = async (requestId: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return

    try {
      await api.post(`/account-request/reject/${requestId}?rejectorId=${user.id}&rejectorRole=${user.role}&reason=${encodeURIComponent(reason)}`, {})
      toast.success('Account request rejected')
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    }
  }

  const handleDeleteAbandonedProfile = async (userId: string, userName: string) => {
    if (!window.confirm(`Delete profile for ${userName}? This cannot be undone.`)) return

    try {
      await api.delete(`/user/delete/${userId}?deletedBy=${user.id}`, {})
      toast.success('✓ Profile deleted')
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleDisableSpecificAccount = async (accountId: string, accountNumber: string) => {
    try {
      await api.post(`/account/disable/${accountId}?disabledBy=${user.id}`, {})
      toast.success(`${accountNumber} disabled`)
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable account')
    }
  }

  const handleEnableSpecificAccount = async (accountId: string, accountNumber: string) => {
    try {
      await api.post(`/account/enable/${accountId}?enabledBy=${user.id}`, {})
      toast.success(`${accountNumber} enabled`)
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable account')
    }
  }

  const getUserTransactions = async (userId: string) => {
    try {
      // Get all accounts for this user
      const accRes = await api.get(`/account/user/${userId}`)
      const accounts = accRes.data.data || []
      const accountNumbers = accounts.map((a: any) => a.accountNumber)

      // Filter transactions by these account numbers
      return allTransactions.filter(tx =>
        accountNumbers.includes(tx.fromAccount) || accountNumbers.includes(tx.toAccount)
      )
    } catch (err) {
      console.error('Failed to get user transactions:', err)
      return []
    }
  }

  const handleViewTransactions = async (customer: any) => {
    setSelectedCustomer(customer)
    const txs = await getUserTransactions(customer.id)
    setModalTransactions(txs)
    setShowTransactionsModal(true)
  }

  const handleViewAccountTransactions = async (customer: any, account: any) => {
    setSelectedCustomer(customer)
    setSelectedAccount(account)
    try {
      // Filter all transactions to show only for this account
      const accountTransactions = allTransactions.filter(tx =>
        tx.fromAccount === account.accountNumber || tx.toAccount === account.accountNumber
      )
      setModalTransactions(accountTransactions)
    } catch (err) {
      console.error('Failed to load account transactions:', err)
      setModalTransactions([])
    }
    setShowTransactionsModal(true)
  }

  const downloadTransactions = async (customer: any) => {
    const transactions = await getUserTransactions(customer.id)
    const csv = [
      ['Transaction ID', 'From Account', 'To Account', 'Amount', 'Type', 'Status', 'Date'],
      ...transactions.map(tx => [
        tx.id || '',
        tx.fromAccount || '',
        tx.toAccount || '',
        tx.amount || '',
        tx.type || '',
        tx.status || '',
        new Date(tx.date).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${customer.firstName}_${customer.lastName}_transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Transactions downloaded')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>EMPLOYEE PANEL</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Customer <span style={{ color: '#00FFB2' }}>Management</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Manage customers, verify accounts, and monitor transactions</div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', overflowX: 'auto' }}>
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
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            ALL CUSTOMERS ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('accountRequests')}
            style={{
              background: activeTab === 'accountRequests' ? 'rgba(245,200,66,0.1)' : 'transparent',
              border: activeTab === 'accountRequests' ? '1px solid rgba(245,200,66,0.3)' : '1px solid transparent',
              color: activeTab === 'accountRequests' ? '#F5C842' : '#4A6080',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            ACCOUNT REQUESTS ({accountRequests.length})
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
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            PENDING VERIFICATION ({pendingAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('abandoned')}
            style={{
              background: activeTab === 'abandoned' ? 'rgba(255,77,109,0.1)' : 'transparent',
              border: activeTab === 'abandoned' ? '1px solid rgba(255,77,109,0.3)' : '1px solid transparent',
              color: activeTab === 'abandoned' ? '#FF4D6D' : '#4A6080',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            ABANDONED PROFILES ({abandonedProfiles.length})
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
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            TRANSACTION LOGS ({allTransactions.length})
          </button>
        </div>

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#00FFB2' }}>CUSTOMER DIRECTORY</div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,255,178,0.3)',
                  borderRadius: '8px',
                  color: '#F0EFEA',
                  width: '300px',
                  fontSize: '12px'
                }}
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>
                {searchTerm ? 'No customers found matching your search' : 'No customers'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>CUSTOMER NAME</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>EMAIL</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>PHONE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT TYPE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT NUMBER</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>BALANCE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACC. STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.flatMap((cust) =>
                      (customerAccounts[cust.id] || []).map((acc: any, idx: number) => (
                        <tr key={`${cust.id}-${acc.id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          {/* Show customer name only on first account row */}
                          {idx === 0 ? (
                            <>
                              <td style={{ padding: '12px', fontSize: '12px' }}>{cust.firstName} {cust.lastName}</td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{cust.email}</td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{cust.phone}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}></td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}></td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}></td>
                            </>
                          )}

                          <td style={{ padding: '12px', fontSize: '12px' }}>
                            {(() => {
                              const type = acc.accountType?.toUpperCase() || 'CURRENT'
                              let bgColor = 'rgba(59,158,255,0.2)'
                              let textColor = '#3B9EFF'
                              let icon = '💼'

                              if (type === 'SAVING') {
                                bgColor = 'rgba(255,184,0,0.2)'
                                textColor = '#FFB800'
                                icon = '🏦'
                              } else if (type === 'FIXED_DEPOSIT') {
                                bgColor = 'rgba(200,0,255,0.2)'
                                textColor = '#C800FF'
                                icon = '📦'
                              } else if (type === 'SALARY') {
                                bgColor = 'rgba(0,255,150,0.2)'
                                textColor = '#00FF96'
                                icon = '💰'
                              }

                              return (
                                <span style={{
                                  background: bgColor,
                                  color: textColor,
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700'
                                }}>
                                  {icon} {type}
                                </span>
                              )
                            })()}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{acc.accountNumber}</td>
                          <td style={{ padding: '12px', fontSize: '12px', fontWeight: '700' }}>₹{acc.balance?.toLocaleString() || '0'}</td>
                          <td style={{ padding: '12px', fontSize: '12px' }}>
                            <span style={{
                              background: acc.status === 'ACTIVE' ? 'rgba(0,255,178,0.2)' : 'rgba(255,77,109,0.2)',
                              color: acc.status === 'ACTIVE' ? '#00FFB2' : '#FF4D6D',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}>
                              {acc.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setSelectedCustomer(cust)
                                setSelectedAccount(acc)
                                handleViewAccountTransactions(cust, acc)
                              }}
                              style={{
                                background: 'rgba(0,255,178,0.1)',
                                border: '1px solid rgba(0,255,178,0.3)',
                                color: '#00FFB2',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: '600'
                              }}
                            >
                              ⇄ View
                            </button>
                            {acc.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleDisableSpecificAccount(acc.id, acc.accountNumber)}
                                style={{
                                  background: 'rgba(255,77,109,0.1)',
                                  border: '1px solid rgba(255,77,109,0.3)',
                                  color: '#FF4D6D',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: '600'
                                }}
                              >
                                🔒 Disable
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEnableSpecificAccount(acc.id, acc.accountNumber)}
                                style={{
                                  background: 'rgba(0,255,178,0.1)',
                                  border: '1px solid rgba(0,255,178,0.3)',
                                  color: '#00FFB2',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: '600'
                                }}
                              >
                                🔓 Enable
                              </button>
                            )}
                            {idx === 0 && (
                              <button
                                onClick={() => handleEditCustomer(cust)}
                                style={{
                                  background: 'rgba(59,158,255,0.1)',
                                  border: '1px solid rgba(59,158,255,0.3)',
                                  color: '#3B9EFF',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: '600'
                                }}
                              >
                                ✎ Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
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
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>No pending verifications</div>
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
                            ✓ Verify
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

        {/* ACCOUNT REQUESTS TAB */}
        {activeTab === 'accountRequests' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#F5C842', marginBottom: '20px' }}>PENDING ACCOUNT CREATION REQUESTS</div>
            {accountRequests.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>No pending requests</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>NAME</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>PHONE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACCOUNT TYPE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>DEPOSIT</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>REQUESTED DATE</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountRequests.map((req) => (
                      <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{req.userName || 'N/A'}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{req.userPhone || 'N/A'}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{req.accountType}</td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>₹{req.initialDeposit}</td>
                        <td style={{ padding: '12px', fontSize: '11px', color: '#4A6080' }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          <span style={{
                            background: 'rgba(245,200,66,0.2)',
                            color: '#F5C842',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>● {req.status}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleApproveAccountRequest(req.id)}
                            style={{
                              background: 'rgba(0,255,178,0.1)',
                              border: '1px solid rgba(0,255,178,0.3)',
                              color: '#00FFB2',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectAccountRequest(req.id)}
                            style={{
                              background: 'rgba(255,77,109,0.1)',
                              border: '1px solid rgba(255,77,109,0.3)',
                              color: '#FF4D6D',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}
                          >
                            ✗ Reject
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

        {/* ABANDONED PROFILES TAB */}
        {activeTab === 'abandoned' && (
          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#FF4D6D', marginBottom: '20px' }}>ABANDONED PROFILES (Registered but no accounts)</div>
            {abandonedProfiles.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>No abandoned profiles</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>NAME</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>EMAIL</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>REGISTERED</th>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#4A6080', fontSize: '11px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abandonedProfiles.map((profile) => (
                      <tr key={profile.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={{ padding: '12px', fontSize: '12px' }}>{profile.firstName || 'N/A'} {profile.lastName || ''}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>{profile.email}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#4A6080' }}>
                          {profile.registrationStartedAt ? new Date(profile.registrationStartedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px' }}>
                          <button
                            onClick={() => handleDeleteAbandonedProfile(profile.id, profile.email)}
                            style={{
                              background: 'rgba(255,77,109,0.1)',
                              border: '1px solid rgba(255,77,109,0.3)',
                              color: '#FF4D6D',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '9px',
                              fontWeight: '600'
                            }}
                          >
                            🗑️ Delete
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
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#3B9EFF', marginBottom: '20px' }}>CUSTOMER TRANSACTION REPORTS</div>
            {customers.length === 0 ? (
              <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>No customers</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {customers.map((cust) => {
                  const custTxCount = transactionCounts[cust.id] || 0
                  return (
                    <div key={cust.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(59,158,255,0.2)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#F0EFEA', marginBottom: '12px' }}>
                        {cust.firstName} {cust.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '4px' }}>Email: {cust.email}</div>
                      <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '12px' }}>Transactions: <span style={{ color: '#3B9EFF' }}>{custTxCount}</span></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleViewTransactions(cust)}
                          style={{
                            flex: 1,
                            background: 'rgba(59,158,255,0.1)',
                            border: '1px solid rgba(59,158,255,0.3)',
                            color: '#3B9EFF',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadTransactions(cust)}
                          style={{
                            flex: 1,
                            background: 'rgba(0,255,178,0.1)',
                            border: '1px solid rgba(0,255,178,0.3)',
                            color: '#00FFB2',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}
                        >
                          ⬇ Download
                        </button>
                      </div>
                    </div>
                  )
                })}
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
            zIndex: 1000,
            overflow: 'auto'
          }}>
            <div style={{
              background: '#0A1220',
              border: '1px solid rgba(0,255,178,0.3)',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '700px',
              margin: '20px auto',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#00FFB2' }}>
                Edit {selectedCustomer.firstName}'s Information
              </div>

              {/* Basic Info Section */}
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#00FFB2', marginBottom: '12px' }}>BASIC INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>First Name</label>
                    <input type="text" value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Last Name</label>
                    <input type="text" value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Phone</label>
                  <input type="tel" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Address</label>
                  <input type="text" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>City</label>
                    <input type="text" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>State</label>
                    <input type="text" value={editData.state} onChange={(e) => setEditData({ ...editData, state: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>PIN Code</label>
                    <input type="text" value={editData.pinCode} onChange={(e) => setEditData({ ...editData, pinCode: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* KYC Section */}
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#3B9EFF', marginBottom: '12px' }}>KYC INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Aadhaar Number</label>
                    <input type="text" value={editData.aadhaar} onChange={(e) => setEditData({ ...editData, aadhaar: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>PAN Number</label>
                    <input type="text" value={editData.pan} onChange={(e) => setEditData({ ...editData, pan: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Education</label>
                    <select value={editData.education} onChange={(e) => setEditData({ ...editData, education: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }}>
                      <option value="">Select</option>
                      <option value="Non-Graduate">Non-Graduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Income Level</label>
                    <select value={editData.income} onChange={(e) => setEditData({ ...editData, income: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }}>
                      <option value="">Select</option>
                      <option value="<1L">&lt; ₹1 Lakh</option>
                      <option value="1L-5L">₹1L - ₹5L</option>
                      <option value="5L-10L">₹5L - ₹10L</option>
                      <option value=">10L">&gt; ₹10L</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#3A5070', marginBottom: '6px' }}>Occupation</label>
                  <select value={editData.occupation} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#F0EFEA', boxSizing: 'border-box' }}>
                    <option value="">Select</option>
                    <option value="Student">Student</option>
                    <option value="Private Job">Private Job</option>
                    <option value="Government Job">Government Job</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#F0EFEA', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.seniorCitizen} onChange={(e) => setEditData({ ...editData, seniorCitizen: e.target.checked })} />
                    Senior Citizen
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#F0EFEA', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.existingCustomer} onChange={(e) => setEditData({ ...editData, existingCustomer: e.target.checked })} />
                    Existing Customer
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSaveCustomer} style={{ flex: 1, background: 'linear-gradient(135deg, #00FFB2, #00DD99)', border: 'none', color: '#060A12', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                  Save Changes
                </button>
                <button onClick={() => setShowEditModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#F0EFEA', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
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
            zIndex: 1000,
            overflow: 'auto'
          }}>
            <div style={{
              background: '#0A1220',
              border: '1px solid rgba(59,158,255,0.3)',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '800px',
              margin: '20px auto',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#3B9EFF', marginBottom: '8px' }}>
                    {selectedCustomer.firstName}'s Transactions
                  </div>
                  {selectedAccount && (
                    <div style={{ fontSize: '12px', color: '#4A6080' }}>
                      <span style={{
                        background: (() => {
                          const type = selectedAccount?.accountType?.toUpperCase() || 'CURRENT'
                          if (type === 'SAVING') return 'rgba(255,184,0,0.2)'
                          if (type === 'FIXED_DEPOSIT') return 'rgba(200,0,255,0.2)'
                          if (type === 'SALARY') return 'rgba(0,255,150,0.2)'
                          return 'rgba(59,158,255,0.2)'
                        })(),
                        color: (() => {
                          const type = selectedAccount?.accountType?.toUpperCase() || 'CURRENT'
                          if (type === 'SAVING') return '#FFB800'
                          if (type === 'FIXED_DEPOSIT') return '#C800FF'
                          if (type === 'SALARY') return '#00FF96'
                          return '#3B9EFF'
                        })(),
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {(() => {
                          const type = selectedAccount?.accountType?.toUpperCase() || 'CURRENT'
                          let icon = '💼'
                          if (type === 'SAVING') icon = '🏦'
                          else if (type === 'FIXED_DEPOSIT') icon = '📦'
                          else if (type === 'SALARY') icon = '💰'
                          return `${icon} ${type} - ${selectedAccount?.accountNumber}`
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => downloadTransactions(selectedCustomer)}
                  style={{
                    background: 'rgba(0,255,178,0.1)',
                    border: '1px solid rgba(0,255,178,0.3)',
                    color: '#00FFB2',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  ⬇ Download Report
                </button>
              </div>

              {modalTransactions.length === 0 ? (
                <div style={{ color: '#4A6080', textAlign: 'center', padding: '40px 20px' }}>No transactions</div>
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
                      {modalTransactions.map((tx) => (
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
