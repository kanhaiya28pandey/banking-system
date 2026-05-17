import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'

export default function MultiStepRegistration() {
  const { user, token } = useSelector((s: any) => s.auth)
  const navigate = useNavigate()
  const [currentPhase, setCurrentPhase] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isSecondAccount, setIsSecondAccount] = useState(false)

  // Get email from logged-in user
  const userEmail = user?.email

  useEffect(() => {
    if (!userEmail) {
      toast.error('Please login first to create account')
      navigate('/login')
      return
    }

    // Check if user already has accounts (means they're creating second account)
    const checkIfSecondAccount = async () => {
      try {
        // Method 1: Check registration phase
        const userRes = await api.get(`/user/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (userRes.data.success && userRes.data.data) {
          const userData = userRes.data.data
          console.log('User data fetched:', {
            registrationPhase: userData.registrationPhase,
            firstName: userData.firstName,
            hasKYC: !!userData.aadhaarNumber
          })

          // Check if this is a second account (registrationPhase COMPLETED or user has accounts)
          const isSecond = userData.registrationPhase === 'COMPLETED' || userData.registrationPhase === 'COMPLETED'

          if (isSecond || userData.firstName) {
            // This is likely a second account - user already has completed registration
            setIsSecondAccount(true)

            // Pre-fill all Phase 1 data
            const phase1Data = {
              firstName: userData.firstName || '',
              middleName: userData.middleName || '',
              lastName: userData.lastName || '',
              fathersName: userData.fathersName || '',
              phone: userData.phone || '',
              gender: userData.gender || '',
              dateOfBirth: userData.dateOfBirth || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              pinCode: userData.pinCode || ''
            }
            setPhase1(phase1Data)
            console.log('Phase 1 pre-filled:', phase1Data)

            // Pre-fill all Phase 2 data
            const phase2Data = {
              religion: userData.religion || '',
              category: userData.category || '',
              incomeRange: userData.incomeRange || '',
              educationalQualification: userData.educationalQualification || '',
              educationOtherDetails: userData.educationOtherDetails || '',
              occupation: userData.occupation || '',
              occupationOtherDetails: userData.occupationOtherDetails || '',
              panNumber: userData.panNumber || '',
              aadhaarNumber: userData.aadhaarNumber || '',
              seniorCitizen: userData.seniorCitizen || false,
              existingAccountHolder: userData.existingAccountHolder || false
            }
            setPhase2(phase2Data)
            console.log('Phase 2 pre-filled:', phase2Data)

            setCurrentPhase(1)
          }
        }
      } catch (err) {
        console.warn('Could not check second account status:', err)
      }
    }

    checkIfSecondAccount()

    // Handle browser back button and page close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentPhase < 5 && currentPhase > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    const handleUnload = () => {
      if (currentPhase < 5 && currentPhase > 0) {
        try {
          navigator.sendBeacon(`/api/auth/register/mark-abandoned?email=${userEmail}`, new Blob())
        } catch (err) {
          console.warn('Could not mark registration as abandoned:', err)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleUnload)
    }
  }, [userEmail, navigate, token, user?.id])

  // Phase 1: Personal Details (email removed - already have it)
  const [phase1, setPhase1] = useState({
    firstName: '', middleName: '', lastName: '', fathersName: '',
    gender: '', dateOfBirth: '', address: '', city: '', state: '', pinCode: '', phone: ''
  })

  // Phase 2: KYC
  const [phase2, setPhase2] = useState({
    religion: '', category: '', incomeRange: '', educationalQualification: '',
    educationOtherDetails: '', occupation: '', occupationOtherDetails: '',
    panNumber: '', aadhaarNumber: '', seniorCitizen: false, existingAccountHolder: false
  })

  // Phase 3: Account Details
  const [phase3, setPhase3] = useState({
    accountType: 'SAVING', atmCard: false, internetBanking: false, mobileBanking: false,
    emailAlerts: false, chequeBook: false, eStatement: false, initialDeposit: 1000
  })

  // Phase 4: Transaction PIN Only
  const [phase4, setPhase4] = useState({
    transactionPin: '', confirmTransactionPin: ''
  })

  // Phase 5: OTP
  const [phase5, setPhase5] = useState({ otpCode: '' })

  // States list
  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

  // Validate Phase 1 fields (email removed - auto-filled from profile)
  const validatePhase1 = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (!phase1.firstName.trim()) errors.push('First name is required')
    if (!phase1.lastName.trim()) errors.push('Last name is required')
    if (!phase1.fathersName.trim()) errors.push("Father's name is required")
    if (!phase1.gender) errors.push('Gender is required')
    if (!phase1.dateOfBirth) errors.push('Date of birth is required')
    if (!phase1.phone.trim() || !/^\d{10}$/.test(phase1.phone)) errors.push('Phone must be 10 digits')
    if (!phase1.address.trim() || phase1.address.length < 10) errors.push('Address must be at least 10 characters')
    if (!phase1.city.trim()) errors.push('City is required')
    if (!phase1.state) errors.push('State is required')
    if (!phase1.pinCode || !/^\d{6}$/.test(phase1.pinCode)) errors.push('Pin code must be 6 digits')

    return { valid: errors.length === 0, errors }
  }

  const handlePhase1Submit = async () => {
    const { valid, errors } = validatePhase1()

    if (!valid) {
      errors.forEach(err => toast.error(err))
      return
    }

    // If second account, skip backend submission and just move to next phase
    if (isSecondAccount) {
      setCurrentPhase(2)
      return
    }

    setLoading(true)
    try {
      const res = await api.post(`/auth/register/phase1?email=${userEmail}`, phase1, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success(res.data.message)
        setCurrentPhase(2)
      } else {
        console.error('Phase 1 Error:', res.data)
        toast.error(res.data.message || 'Failed to save Phase 1 information')
      }
    } catch (err: any) {
      console.error('Phase 1 Exception:', err.response?.data || err.message)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit Phase 1'
      toast.error(errorMsg)
    }
    setLoading(false)
  }

  const handlePhase2Submit = async () => {
    // If second account, skip backend submission and just move to next phase
    if (isSecondAccount) {
      setCurrentPhase(3)
      return
    }

    setLoading(true)
    try {
      const res = await api.post(`/auth/register/phase2?email=${userEmail}`, phase2, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success(res.data.message)
        setCurrentPhase(3)
      } else {
        console.error('Phase 2 Error:', res.data)
        toast.error(res.data.message || 'Failed to save Phase 2 information')
      }
    } catch (err: any) {
      console.error('Phase 2 Exception:', err.response?.data || err.message)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit Phase 2'
      toast.error(errorMsg)
    }
    setLoading(false)
  }

  const handlePhase3Submit = async () => {
    setLoading(true)
    try {
      // Check if user already has this account type
      const accountsRes = await api.get(`/account/user/${user?.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const existingAccounts = accountsRes.data.data || []

      // Check for duplicate account type
      const hasSameType = existingAccounts.some((acc: any) =>
        acc.accountType.toUpperCase() === phase3.accountType.toUpperCase()
      )

      if (hasSameType) {
        toast.error(`❌ You already have a ${phase3.accountType} account!\nCannot create duplicate account type.`)
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/accounts')
        }, 2000)
        setLoading(false)
        return
      }

      const res = await api.post(`/auth/register/phase3?email=${userEmail}`, phase3, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success(res.data.message)
        setCurrentPhase(4)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    }
    setLoading(false)
  }

  const handlePhase4Submit = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/auth/register/phase4?email=${userEmail}`, phase4, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success(res.data.message)
        // Send OTP
        await sendOTP()
        setCurrentPhase(5)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    }
    setLoading(false)
  }

  const sendOTP = async () => {
    try {
      const res = await api.post(`/auth/register/send-otp?email=${userEmail}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success('OTP sent to your email!')
      }
    } catch (err: any) {
      toast.error('Failed to send OTP')
    }
  }

  const handlePhase5Submit = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/auth/register/phase5?email=${userEmail}`, phase5, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success('✅ Account creation request sent! Awaiting manager approval.')
        setTimeout(() => window.location.href = '/accounts', 2000)
      } else {
        toast.error(res.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    }
    setLoading(false)
  }

  const handleCancelRegistration = async () => {
    if (!window.confirm('⚠️ Are you sure? This will cancel this account creation request and you\'ll need to start over.')) {
      return
    }

    // If second account is detected, skip backend call and just redirect
    if (isSecondAccount) {
      toast.success('Account creation cancelled')
      setTimeout(() => window.location.href = '/accounts', 1000)
      return
    }

    // For first account, try to cancel the registration
    setLoading(true)
    try {
      const res = await api.delete(`/auth/register/cancel?email=${userEmail}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) {
        toast.success('Registration cancelled. Redirecting...')
        setTimeout(() => window.location.href = '/accounts', 1500)
      } else {
        // If error about existing accounts, it might be a second account attempt
        if (res.data.message && res.data.message.includes('Account')) {
          toast.success('Account creation cancelled')
          setTimeout(() => window.location.href = '/accounts', 1000)
        } else {
          toast.error(res.data.message || 'Failed to cancel registration')
        }
      }
    } catch (err: any) {
      // If error about existing accounts, treat as second account cancellation
      const errorMsg = err.response?.data?.message || 'Error cancelling registration'
      if (errorMsg.includes('Account') || errorMsg.includes('already exist')) {
        toast.success('Account creation cancelled')
        setTimeout(() => window.location.href = '/accounts', 1000)
      } else {
        toast.error(errorMsg)
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #ccc',
    borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace'
  }

  const disabledInputStyle = {
    ...inputStyle,
    background: '#f0f0f0',
    color: '#999',
    cursor: 'not-allowed',
    border: '1px solid #ddd'
  }

  const labelStyle = {
    display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333'
  }

  const colStyle = { flex: 1, marginRight: '12px' }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', color: '#F5C842', marginBottom: '8px' }}>🏧 Create Your Bank Account</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Step {currentPhase} of 5 - Fill your KYC details</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(phase => (
              <div key={phase} style={{
                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: currentPhase >= phase ? '#F5C842' : '#ddd',
                color: currentPhase >= phase ? 'white' : '#999', fontWeight: 'bold'
              }}>
                {phase}
              </div>
            ))}
          </div>
          <button onClick={handleCancelRegistration} style={{
            marginTop: '20px', padding: '8px 16px', background: '#FF6B6B', color: 'white',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
            cursor: 'pointer', opacity: loading ? 0.6 : 1
          }} disabled={loading}>
            🚫 Cancel Account Creation
          </button>
        </div>

        {/* PHASE 1: PERSONAL DETAILS */}
        {currentPhase === 1 && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>📝 Phase 1: Personal Details</h2>
            {isSecondAccount && (
              <div style={{ background: '#e8f4f8', border: '1px solid #4db8d4', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#0c5f7a' }}>
                ℹ️ You're creating another account. Your basic details are locked from your previous account - they cannot be changed.
              </div>
            )}

            {/* Show email from profile (read-only) */}
            <div style={{ marginBottom: '12px', background: '#f0f0f0', padding: '12px', borderRadius: '8px' }}>
              <label style={labelStyle}>📧 Email Address (from profile)</label>
              <div style={{ padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', color: '#333' }}>
                {userEmail} ✅
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={colStyle}>
                <label style={labelStyle}>First Name *</label>
                <input type="text" value={phase1.firstName} onChange={e => setPhase1({...phase1, firstName: e.target.value})} placeholder="First name" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Middle Name</label>
                <input type="text" value={phase1.middleName} onChange={e => setPhase1({...phase1, middleName: e.target.value})} placeholder="Middle name" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Last Name *</label>
                <input type="text" value={phase1.lastName} onChange={e => setPhase1({...phase1, lastName: e.target.value})} placeholder="Last name" disabled={isSecondAccount} style={isSecondAccount ? {...disabledInputStyle, marginRight: 0} : {...inputStyle, marginRight: 0}} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Father's Name *</label>
              <input type="text" value={phase1.fathersName} onChange={e => setPhase1({...phase1, fathersName: e.target.value})} placeholder="Father's name" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Phone Number *</label>
              <input type="tel" value={phase1.phone} onChange={e => setPhase1({...phase1, phone: e.target.value})} placeholder="10-digit phone" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={colStyle}>
                <label style={labelStyle}>Gender *</label>
                <select value={phase1.gender} onChange={e => setPhase1({...phase1, gender: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Date of Birth *</label>
                <input type="date" value={phase1.dateOfBirth} onChange={e => setPhase1({...phase1, dateOfBirth: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? {...disabledInputStyle, marginRight: 0} : {...inputStyle, marginRight: 0}} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Address *</label>
              <textarea value={phase1.address} onChange={e => setPhase1({...phase1, address: e.target.value})} placeholder="Street address" disabled={isSecondAccount} style={{...(isSecondAccount ? disabledInputStyle : inputStyle), minHeight: '80px', fontFamily: 'Arial'}} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={colStyle}>
                <label style={labelStyle}>City *</label>
                <input type="text" value={phase1.city} onChange={e => setPhase1({...phase1, city: e.target.value})} placeholder="City" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>State *</label>
                <select value={phase1.state} onChange={e => setPhase1({...phase1, state: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                  <option value="">Select state</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Pin Code *</label>
                <input type="text" value={phase1.pinCode} onChange={e => setPhase1({...phase1, pinCode: e.target.value})} placeholder="6-digit pin" disabled={isSecondAccount} style={isSecondAccount ? {...disabledInputStyle, marginRight: 0} : {...inputStyle, marginRight: 0}} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button onClick={handlePhase1Submit} style={{
                flex: 1, padding: '14px', background: '#F5C842', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', opacity: validatePhase1().valid ? 1 : 0.6
              }} disabled={loading || !validatePhase1().valid}>
                {loading ? '⏳ Processing...' : `✓ Next: Phase 2`}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: KYC INFORMATION */}
        {currentPhase === 2 && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>🆔 Phase 2: KYC Information</h2>
            {isSecondAccount && (
              <div style={{ background: '#e8f4f8', border: '1px solid #4db8d4', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#0c5f7a' }}>
                ℹ️ KYC information is locked from your previous account - you cannot modify these details.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={colStyle}>
                <label style={labelStyle}>Religion *</label>
                <select value={phase2.religion} onChange={e => setPhase2({...phase2, religion: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                  <option value="">Select religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Christian">Christian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Category *</label>
                <select value={phase2.category} onChange={e => setPhase2({...phase2, category: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? {...disabledInputStyle, marginRight: 0} : {...inputStyle, marginRight: 0}}>
                  <option value="">Select category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Income Range *</label>
              <select value={phase2.incomeRange} onChange={e => setPhase2({...phase2, incomeRange: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                <option value="">Select income range</option>
                <option value="<1L">Less than ₹1L</option>
                <option value="1L-5L">₹1L - ₹5L</option>
                <option value="5L-10L">₹5L - ₹10L</option>
                <option value=">10L">Greater than ₹10L</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Educational Qualification *</label>
              <select value={phase2.educationalQualification} onChange={e => setPhase2({...phase2, educationalQualification: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                <option value="">Select qualification</option>
                <option value="Non-Graduate">Non-Graduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {phase2.educationalQualification === 'Other' && (
              <div style={{ marginBottom: '12px' }}>
                <input type="text" value={phase2.educationOtherDetails} onChange={e => setPhase2({...phase2, educationOtherDetails: e.target.value})} placeholder="Please specify" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Occupation *</label>
              <select value={phase2.occupation} onChange={e => setPhase2({...phase2, occupation: e.target.value})} disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle}>
                <option value="">Select occupation</option>
                <option value="Student">Student</option>
                <option value="Private Job">Private Job</option>
                <option value="Government Job">Government Job</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {phase2.occupation === 'Other' && (
              <div style={{ marginBottom: '12px' }}>
                <input type="text" value={phase2.occupationOtherDetails} onChange={e => setPhase2({...phase2, occupationOtherDetails: e.target.value})} placeholder="Please specify" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={colStyle}>
                <label style={labelStyle}>PAN Number *</label>
                <input type="text" value={phase2.panNumber} onChange={e => setPhase2({...phase2, panNumber: e.target.value.toUpperCase()})} placeholder="e.g., AAAPL5055K" disabled={isSecondAccount} style={isSecondAccount ? disabledInputStyle : inputStyle} />
              </div>
              <div style={colStyle}>
                <label style={labelStyle}>Aadhaar Number *</label>
                <input type="text" value={phase2.aadhaarNumber} onChange={e => setPhase2({...phase2, aadhaarNumber: e.target.value})} placeholder="12-digit number" disabled={isSecondAccount} style={isSecondAccount ? {...disabledInputStyle, marginRight: 0} : {...inputStyle, marginRight: 0}} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: '#f9f9f9', padding: '16px', borderRadius: '8px', opacity: isSecondAccount ? 0.6 : 1 }}>
              <label style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', cursor: isSecondAccount ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                <input type="checkbox" checked={phase2.seniorCitizen} onChange={e => setPhase2({...phase2, seniorCitizen: e.target.checked})} disabled={isSecondAccount} style={{ width: '18px', height: '18px', cursor: isSecondAccount ? 'not-allowed' : 'pointer' }} />
                👴 Senior Citizen
              </label>
              <label style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', cursor: isSecondAccount ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                <input type="checkbox" checked={phase2.existingAccountHolder} onChange={e => setPhase2({...phase2, existingAccountHolder: e.target.checked})} disabled={isSecondAccount} style={{ width: '18px', height: '18px', cursor: isSecondAccount ? 'not-allowed' : 'pointer' }} />
                🏦 Existing Account Holder
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button onClick={() => setCurrentPhase(1)} style={{
                flex: 1, padding: '14px', background: '#ddd', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>← Back</button>
              <button onClick={handlePhase2Submit} style={{
                flex: 1, padding: '14px', background: '#F5C842', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }} disabled={loading}>
                {loading ? '⏳ Processing...' : '✓ Next: Phase 3'}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: ACCOUNT DETAILS */}
        {currentPhase === 3 && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>🏦 Phase 3: Account Details</h2>

            <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
              <label style={{...labelStyle, marginBottom: '12px'}}>Account Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {['SAVING', 'CURRENT', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    <input type="radio" name="accountType" checked={phase3.accountType === type} onChange={() => setPhase3({...phase3, accountType: type})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    {type === 'SAVING' ? '💰 Savings' : type === 'CURRENT' ? '💼 Current' : type === 'FIXED_DEPOSIT' ? '📊 Fixed Deposit' : '🔄 Recurring Deposit'}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
              <label style={{...labelStyle, marginBottom: '12px'}}>Services Required</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { key: 'atmCard', label: '🏧 ATM Card' },
                  { key: 'internetBanking', label: '💻 Internet Banking' },
                  { key: 'mobileBanking', label: '📱 Mobile Banking' },
                  { key: 'emailAlerts', label: '📧 Email Alerts' },
                  { key: 'chequeBook', label: '📋 Cheque Book' },
                  { key: 'eStatement', label: '📄 E-Statement' }
                ].map(service => (
                  <label key={service.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    <input type="checkbox" checked={(phase3 as any)[service.key]} onChange={e => setPhase3({...phase3, [service.key]: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Initial Deposit (min ₹1000) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>₹</span>
                <input type="number" value={phase3.initialDeposit} onChange={e => setPhase3({...phase3, initialDeposit: Number(e.target.value)})} min="1000" style={inputStyle} />
              </div>
              {phase3.initialDeposit < 1000 && <p style={{ color: '#FF6B6B', fontSize: '12px' }}>❌ Minimum ₹1000 required</p>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button onClick={() => setCurrentPhase(2)} style={{
                flex: 1, padding: '14px', background: '#ddd', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>← Back</button>
              <button onClick={handlePhase3Submit} style={{
                flex: 1, padding: '14px', background: phase3.initialDeposit < 1000 ? '#ccc' : '#F5C842', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }} disabled={loading || phase3.initialDeposit < 1000}>
                {loading ? '⏳ Processing...' : '✓ Next: Phase 4'}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: SECURITY SETUP */}
        {currentPhase === 4 && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>🔐 Phase 4: Transaction PIN Setup</h2>

            <div style={{ background: '#f0f8ff', border: '1px solid #4db8d4', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#0c5f7a' }}>
              ℹ️ Your login password was already created during registration. You can change it anytime from the Profile tab. Here you only need to set a Transaction PIN for secure transactions.
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Transaction PIN (4 digits) *</label>
              <input type="password" value={phase4.transactionPin} onChange={e => setPhase4({...phase4, transactionPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} placeholder="4-digit PIN" maxLength={4} style={inputStyle} />
              <small style={{ color: '#666' }}>Enter any 4 digits for transaction verification</small>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Confirm Transaction PIN *</label>
              <input type="password" value={phase4.confirmTransactionPin} onChange={e => setPhase4({...phase4, confirmTransactionPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} placeholder="4-digit PIN" maxLength={4} style={inputStyle} />
              {phase4.transactionPin !== phase4.confirmTransactionPin && phase4.confirmTransactionPin && <p style={{ color: '#FF6B6B', fontSize: '12px' }}>❌ PINs don't match</p>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button onClick={() => setCurrentPhase(3)} style={{
                flex: 1, padding: '14px', background: '#ddd', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>← Back</button>
              <button onClick={handlePhase4Submit} style={{
                flex: 1, padding: '14px', background: '#F5C842', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }} disabled={loading || phase4.transactionPin !== phase4.confirmTransactionPin || phase4.transactionPin.length !== 4}>
                {loading ? '⏳ Processing...' : '✓ Next: Phase 5'}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: OTP VERIFICATION */}
        {currentPhase === 5 && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>✅ Phase 5: Verify & Complete</h2>

            <div style={{ background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', color: '#2e7d32', fontWeight: 'bold' }}>✅ OTP Sent</p>
              <p style={{ margin: 0, color: '#558b2f', fontSize: '14px' }}>An OTP has been sent to {userEmail}. Please check your email and enter it below.</p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Enter OTP Code *</label>
              <input type="text" value={phase5.otpCode} onChange={e => setPhase5({...phase5, otpCode: e.target.value})} placeholder="6-digit OTP" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button onClick={() => sendOTP()} style={{
                flex: 1, padding: '14px', background: '#ddd', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }} disabled={loading}>
                🔄 Resend OTP
              </button>
              <button onClick={handlePhase5Submit} style={{
                flex: 1, padding: '14px', background: '#F5C842', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }} disabled={loading || !phase5.otpCode}>
                {loading ? '⏳ Sending...' : '📤 Send Account Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
