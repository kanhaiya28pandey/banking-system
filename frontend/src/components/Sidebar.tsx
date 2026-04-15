import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'

const navItems = [
  { label: 'Dashboard', path: '/', icon: '⬡' },
  { label: 'Accounts', path: '/accounts', icon: '◈' },
  { label: 'Transactions', path: '/transactions', icon: '⇄' },
  { label: 'Scheduled Transfers', path: '/scheduled-transfers', icon: '⏲️' },
  { label: 'ATM Console', path: '/atm', icon: '◉' },
  { label: 'Profile', path: '/profile', icon: '👤' },
  { label: 'Notifications', path: '/settings/notifications', icon: '🔔' },
  { label: 'Admin Panel', path: '/admin', icon: '⬟' },
]

export default function Sidebar() {
  const loc = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s: any) => s.auth)
  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  return (
    <aside style={{
      width: '240px', background: 'linear-gradient(180deg, #0A1628 0%, #060A12 100%)',
      borderRight: '1px solid rgba(245,200,66,0.12)', display: 'flex',
      flexDirection: 'column', position: 'fixed', height: '100vh', top: 0, left: 0, zIndex: 1000
    }}>
      <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(245,200,66,0.1)', flexShrink: 0 }}>
        <div style={{
          width: '50px', height: '50px', background: 'linear-gradient(135deg, #F5C842, #D4A017)',
          borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', marginBottom: '14px', boxShadow: '0 0 30px rgba(245,200,66,0.4)'
        }}>🏦</div>
        <div style={{ fontSize: '17px', fontWeight: '800', color: '#F5C842', letterSpacing: '3px' }}>NEXBANK</div>
        <div style={{ fontSize: '8px', color: '#4A6080', letterSpacing: '3px', marginTop: '3px' }}>BANKING OS v2.0</div>
      </div>

      <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(245,200,66,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00FFB2', display: 'inline-block', boxShadow: '0 0 8px #00FFB2' }} />
        <span style={{ fontSize: '9px', color: '#7A8FA6', letterSpacing: '2px' }}>SYSTEM</span>
        <span style={{ fontSize: '9px', color: '#00FFB2', letterSpacing: '2px' }}>ONLINE</span>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        <div style={{ padding: '10px 24px 6px', fontSize: '8px', color: '#3A5070', letterSpacing: '3px' }}>NAVIGATION</div>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '13px', padding: '13px 24px',
              color: loc.pathname === item.path ? '#F5C842' : '#7A8FA6',
              background: loc.pathname === item.path ? 'rgba(245,200,66,0.08)' : 'transparent',
              borderLeft: loc.pathname === item.path ? '3px solid #F5C842' : '3px solid transparent',
              fontSize: '15px', fontWeight: '600', transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: '17px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
              {loc.pathname === item.path && (
                <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#F5C842', boxShadow: '0 0 10px rgba(245,200,66,0.9)', flexShrink: 0 }} />
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div style={{ padding: '18px 24px', borderTop: '1px solid rgba(245,200,66,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #F5C842, #D4A017)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: '800', color: '#060A12', flexShrink: 0
          }}>{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#F0EFEA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: '8px', color: '#00FFB2', letterSpacing: '2px', marginTop: '2px' }}>● AUTHENTICATED</div>
          </div>
        </div>
        <button onClick={handleLogout}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.12)'; e.currentTarget.style.color = '#FF4D6D' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F5C842' }}
          style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(245,200,66,0.2)',
            color: '#F5C842', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
            fontSize: '10px', fontWeight: '700', letterSpacing: '2px', transition: 'all 0.25s'
          }}>LOGOUT →</button>
      </div>
    </aside>
  )
}
