import React, { useState, useEffect } from 'react'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => void
  title?: string
  description?: string
}

export default function PinModal({ isOpen, onClose, onConfirm, title = 'TRANSACTION PIN REQUIRED', description = 'Enter your 4-digit PIN to confirm' }: PinModalProps) {
  const [pin, setPin] = useState('')

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handlePinKey(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (pin.length === 4) handleConfirm()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, pin])

  const handlePinKey = (digit: string) => {
    if (pin.length < 4) setPin(p => p + digit)
  }

  const handleClear = () => {
    setPin('')
  }

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin)
      setPin('')
    }
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'linear-gradient(160deg, #0D1829, #080E1A)', border: '2px solid rgba(245,200,66,0.3)', borderRadius: '24px', padding: '32px', maxWidth: '100%', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        {/* Title */}
        <div style={{ fontSize: '14px', color: '#F5C842', fontWeight: '700', marginBottom: '8px', letterSpacing: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '24px' }}>{description}</div>

        {/* PIN Display - Responsive */}
        <div style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: 'clamp(16px, 5vw, 24px)', letterSpacing: '4px', color: '#00FFB2', fontWeight: '700', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {'•'.repeat(pin.length)}{pin.length === 0 && '••••'}
        </div>

        {/* PIN Keypad - Responsive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {['1','2','3','4','5','6','7','8','9','','0',''].map((k, i) => (
            <button
              key={i}
              onClick={() => k && handlePinKey(k)}
              disabled={k === ''}
              style={{
                background: k === '' ? 'transparent' : 'rgba(245,200,66,0.1)',
                border: k === '' ? 'none' : '1px solid rgba(245,200,66,0.25)',
                borderRadius: '10px',
                padding: 'clamp(10px, 3vw, 12px)',
                fontSize: 'clamp(12px, 4vw, 14px)',
                fontWeight: '700',
                color: '#F5C842',
                cursor: k === '' ? 'default' : 'pointer',
                opacity: k === '' ? 0 : 1,
                transition: 'all 0.2s',
                ':active': { transform: 'scale(0.95)' }
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Info Text */}
        <div style={{ fontSize: '10px', color: '#4A6080', marginBottom: '16px', letterSpacing: '1px' }}>
          ⌨️ Use keyboard or buttons • ENTER to confirm • ESC to cancel
        </div>

        {/* Action Buttons - Responsive */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,77,109,0.1)',
              border: '1px solid rgba(255,77,109,0.3)',
              color: '#FF4D6D',
              borderRadius: '10px',
              padding: 'clamp(10px, 2vw, 12px)',
              fontSize: 'clamp(10px, 3vw, 11px)',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleClear}
            style={{
              background: 'rgba(255,77,109,0.1)',
              border: '1px solid rgba(255,77,109,0.3)',
              color: '#FF4D6D',
              borderRadius: '10px',
              padding: 'clamp(10px, 2vw, 12px)',
              fontSize: 'clamp(10px, 3vw, 11px)',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
          >
            CLEAR
          </button>
        </div>

        {/* Confirm Button - Full Width & Responsive */}
        <button
          onClick={handleConfirm}
          disabled={pin.length !== 4}
          style={{
            width: '100%',
            background: pin.length === 4 ? 'linear-gradient(135deg, #F5C842, #D4A017)' : 'rgba(245,200,66,0.1)',
            color: pin.length === 4 ? '#060A12' : '#4A6080',
            border: 'none',
            borderRadius: '10px',
            padding: 'clamp(10px, 2vw, 12px)',
            fontSize: 'clamp(10px, 3vw, 11px)',
            fontWeight: '700',
            cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
            letterSpacing: '1px',
            opacity: pin.length === 4 ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          CONFIRM PIN (4 digits)
        </button>
      </div>
    </div>
  )
}
