import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import { getNotificationPreferences, updateNotificationPreferences, sendTestNotification } from '../api/notificationApi'

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    notificationFrequency: 'INSTANT',
    transactionAlertThreshold: 0
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const res = await getNotificationPreferences()
      if (res.data.success && res.data.data) {
        setPreferences(res.data.data)
      }
    } catch (err) {
      toast.error('Failed to load preferences')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateNotificationPreferences(preferences)
      if (res.data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (err) {
      toast.error('Error saving settings')
    }
    setSaving(false)
  }

  const handleTestEmail = async () => {
    try {
      const res = await sendTestNotification()
      if (res.data.success) {
        toast.success('Test notification sent to your email')
      } else {
        toast.error(res.data.message || 'Failed to send test notification')
      }
    } catch (err) {
      toast.error('Error sending test notification')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>PREFERENCES</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>Notification <span style={{ color: '#F5C842' }}>Settings</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Control how you receive alerts</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4A6080' }}>Loading settings...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '32px' }}>

              {/* Email Notifications */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>📧 Email Notifications</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4A6080' }}>Receive alerts via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotificationsEnabled || false}
                    onChange={(e) => setPreferences({ ...preferences, emailNotificationsEnabled: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* SMS Notifications */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>💬 SMS Notifications</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4A6080' }}>Receive alerts via text message</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.smsNotificationsEnabled || false}
                    onChange={(e) => setPreferences({ ...preferences, smsNotificationsEnabled: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Notification Frequency */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>NOTIFICATION FREQUENCY</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['INSTANT', 'DAILY_DIGEST', 'DISABLED'].map(freq => (
                    <button
                      key={freq}
                      onClick={() => setPreferences({ ...preferences, notificationFrequency: freq })}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: preferences.notificationFrequency === freq ? '2px solid #F5C842' : '1px solid rgba(255,255,255,0.1)',
                        background: preferences.notificationFrequency === freq ? 'rgba(245,200,66,0.1)' : 'rgba(255,255,255,0.02)',
                        color: '#F0EFEA',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      {freq === 'INSTANT' ? '⚡ Instant' : freq === 'DAILY_DIGEST' ? '📋 Daily' : '🔇 Disabled'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Threshold */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ fontSize: '11px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '12px' }}>TRANSACTION ALERT THRESHOLD (₹)</label>
                <input
                  type="number"
                  value={preferences.transactionAlertThreshold || 0}
                  onChange={(e) => setPreferences({ ...preferences, transactionAlertThreshold: parseFloat(e.target.value) || 0 })}
                  placeholder="0 = All transactions"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: '#F0EFEA',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#3A5070' }}>Only notify for transactions above this amount (0 = all transactions)</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={handleTestEmail}
                  style={{
                    background: 'rgba(59,158,255,0.15)',
                    border: '1px solid rgba(59,158,255,0.3)',
                    color: '#3B9EFF',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  📧 TEST EMAIL
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #F5C842, #D4A017)',
                    color: '#060A12',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div>
              <div style={{ background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.12)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '10px', color: '#00FFB2', letterSpacing: '2px', marginBottom: '10px' }}>ℹ️ INFO</div>
                <div style={{ fontSize: '13px', color: '#4A6080', lineHeight: '1.6' }}>
                  <p>Notifications are sent immediately after transactions. Use the threshold to reduce notification volume.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
