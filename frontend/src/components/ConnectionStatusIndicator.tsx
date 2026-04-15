interface ConnectionStatusIndicatorProps {
  connected: boolean
}

export default function ConnectionStatusIndicator({ connected }: ConnectionStatusIndicatorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '8px',
      background: connected ? 'rgba(0,255,178,0.1)' : 'rgba(255,77,109,0.1)',
      border: connected ? '1px solid rgba(0,255,178,0.2)' : '1px solid rgba(255,77,109,0.2)',
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: connected ? '#00FFB2' : '#FF4D6D',
        boxShadow: connected ? '0 0 8px #00FFB2' : 'none',
        animation: connected ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: connected ? '#00FFB2' : '#FF4D6D',
        letterSpacing: '1px',
      }}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
