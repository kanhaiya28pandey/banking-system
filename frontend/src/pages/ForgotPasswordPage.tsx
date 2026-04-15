import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'

type Step = 'email' | 'otp' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const inputStyle: any = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
    padding: '14px 18px', color: '#F0EFEA', fontSize: '15px',
    outline: 'none', boxSizing: 'border-box'
  }

  const handleSendOtp = async () => {
    if (!email) { toast.error('Enter email'); return }
    setLoading(true)
    try {
      const res = await axios.post(`http://localhost:8080/api/auth/forgot-password?email=${email}`)
      if (res.data.success) {
        setGeneratedOtp(res.data.data)
        toast.success('OTP sent!')
        setStep('otp')
      } else { toast.error(res.data.message) }
    } catch { toast.error('Email not found.') }
    setLoading(false)
  }

  const handleVerifyOtp = () => {
    if (otp !== generatedOtp) { toast.error('Invalid OTP'); return }
    toast.success('OTP verified!')
    setStep('reset')
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error('Fill all fields'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return }
    setLoading(true)
    try {
      const res = await axios.post(`http://localhost:8080/api/auth/reset-password?email=${email}&newPassword=${newPassword}`)
      if (res.data.success) {
        toast.success('Password reset!')
        setStep('done')
      } else { toast.error(res.data.message) }
    } catch { toast.error('Failed to reset.') }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060A12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px)',
      backgroundSize: '48px 48px'
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0D1829 0%, #080E1A 100%)',
        border: '1px solid rgba(245,200,66,0.2)', borderRadius: '24px',
        padding: '52px', width: '100%', maxWidth: '440px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)', position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '68px', height: '68px', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 18px', boxShadow: '0 0 40px rgba(245,200,66,0.5)'
          }}>🔐</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#F5C842', letterSpacing: '3px' }}>FORGOT PASSWORD</div>
          <div style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '3px', marginTop: '6px' }}>ACCOUNT RECOVERY</div>
        </div>

        {step === 'email' && (
          <>
            <p style={{ fontSize: '14px', color: '#7A8FA6', marginBottom: '24px', lineHeight: '1.6' }}>Enter your registered email to receive an OTP.</p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@nexbank.com" onKeyDown={e => e.key === 'Enter' && handleSendOtp()} style={inputStyle} />
            </div>
            <button onClick={handleSendOtp} disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)',
              opacity: loading ? 0.7 : 1
            }}>{loading ? 'SENDING...' : 'SEND OTP →'}</button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div style={{ background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#7A8FA6', marginBottom: '6px' }}>DEV MODE — YOUR OTP</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#00FFB2', letterSpacing: '8px', fontFamily: 'monospace' }}>{generatedOtp}</div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>ENTER OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} />
            </div>
            <button onClick={handleVerifyOtp} style={{
              width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '1.5px', marginBottom: '12px',
              boxShadow: '0 6px 24px rgba(245,200,66,0.4)'
            }}>VERIFY OTP →</button>
            <button onClick={() => setStep('email')} style={{
              width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#7A8FA6', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontSize: '13px'
            }}>← Change Email</button>
          </>
        )}

        {step === 'reset' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>NEW PASSWORD</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>CONFIRM PASSWORD</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" style={inputStyle} />
              {confirmPassword && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: newPassword === confirmPassword ? '#00FFB2' : '#FF4D6D' }}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
                </div>
              )}
            </div>
            <button onClick={handleResetPassword} disabled={loading} style={{
              width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)',
              opacity: loading ? 0.7 : 1
            }}>{loading ? 'RESETTING...' : 'RESET PASSWORD →'}</button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#00FFB2', marginBottom: '8px' }}>Password Reset!</div>
            <div style={{ fontSize: '13px', color: '#7A8FA6', marginBottom: '32px' }}>You can now login with your new password.</div>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', letterSpacing: '1.5px', boxShadow: '0 6px 24px rgba(245,200,66,0.4)'
            }}>GO TO LOGIN →</button>
          </div>
        )}

        {step !== 'done' && (
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#7A8FA6' }}>
            Remember password?{' '}
            <Link to="/login" style={{ color: '#F5C842', textDecoration: 'none', fontWeight: '700' }}>Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  )
}
