import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'

export default function AtmPage() {
  const [input, setInput] = useState('')
  const [balance, setBalance] = useState(0)
  const [log, setLog] = useState(['> SESSION STARTED', '> CARD INSERTED', '> PIN VERIFIED: ****'])
  const addLog = (msg: string) => setLog(p => [...p, msg])
  const atmKey = (v: string) => setInput(p => p + v)
  const atmClear = () => { setInput(''); addLog('> INPUT CLEARED') }

  const withdraw = () => {
    const amt = parseInt(input)
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return }
    if (amt > balance) { addLog('> ERROR: INSUFFICIENT FUNDS'); toast.error('Insufficient!') }
    else {
      const nb = balance - amt
      setBalance(nb)
      addLog(`> DISPENSING: ₹${amt.toLocaleString('en-IN')}`)
      addLog(`> NEW BALANCE: ₹${nb.toLocaleString('en-IN')}`)
      toast.success(`₹${amt.toLocaleString('en-IN')} dispensed!`)
    }
    setInput('')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060A12', color: '#F0EFEA' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', color: '#3A5070', letterSpacing: '4px', marginBottom: '8px' }}>SIMULATION MODULE</div>
          <div style={{ fontSize: '34px', fontWeight: '700' }}>ATM <span style={{ color: '#F5C842' }}>Console</span></div>
          <div style={{ fontSize: '14px', color: '#4A6080', marginTop: '6px' }}>Insert card → Verify PIN → Operate</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px' }}>
          <div style={{ background: 'linear-gradient(170deg, #0A1628, #060A12)', border: '2px solid rgba(245,200,66,0.18)', borderRadius: '28px', padding: '32px' }}>
            <div style={{ background: '#020810', border: '2px solid rgba(0,255,178,0.2)', borderRadius: '18px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFB2', display: 'inline-block', boxShadow: '0 0 8px #00FFB2' }} />
                <span style={{ fontSize: '9px', color: '#00FFB2', letterSpacing: '2px' }}>NEXBANK ATM — SECURE SESSION</span>
              </div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#00FFB2', letterSpacing: '-2px' }}>₹{balance.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '11px', color: '#2A4060', marginTop: '6px', letterSpacing: '3px' }}>ACC •••• •••• DEMO</div>
              <div style={{ marginTop: '16px', background: 'rgba(0,255,178,0.05)', border: input ? '1px solid rgba(0,255,178,0.3)' : '1px solid rgba(0,255,178,0.1)', borderRadius: '12px', padding: '14px 18px', minHeight: '52px', display: 'flex', alignItems: 'center' }}>
                {input ? <span style={{ fontSize: '22px', fontWeight: '700', color: '#00FFB2', letterSpacing: '4px' }}>₹ {parseInt(input).toLocaleString('en-IN')}</span> : <span style={{ fontSize: '11px', color: 'rgba(0,255,178,0.25)', letterSpacing: '3px' }}>ENTER AMOUNT...</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '12px' }}>
              {['1','2','3','4','5','6','7','8','9','CLR','0','00'].map(k => (
                <button key={k} onClick={() => k === 'CLR' ? atmClear() : atmKey(k)} style={{ background: k === 'CLR' ? 'rgba(255,77,109,0.1)' : 'rgba(17,29,48,0.9)', border: `1px solid ${k === 'CLR' ? 'rgba(255,77,109,0.25)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '12px', padding: '15px', fontSize: '18px', fontWeight: '700', color: k === 'CLR' ? '#FF4D6D' : '#F0EFEA', cursor: 'pointer' }}>{k}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={withdraw} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>WITHDRAW</button>
              <button onClick={() => { addLog(`> BALANCE: ₹${balance.toLocaleString('en-IN')}`); toast.success(`Balance: ₹${balance.toLocaleString('en-IN')}`) }} style={{ background: 'linear-gradient(135deg, #00FFB2, #00C48A)', color: '#060A12', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>BALANCE</button>
            </div>
          </div>

          <div style={{ background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00FFB2', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', color: '#3A5070', letterSpacing: '3px' }}>TRANSACTION LOG</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' as const }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: l.includes('ERROR') ? '#FF4D6D' : l.includes('DISPENSING') || l.includes('VERIFIED') ? '#00FFB2' : l.includes('CLEARED') ? '#F5C842' : '#2A4060', borderLeft: `2px solid ${l.includes('ERROR') ? 'rgba(255,77,109,0.4)' : l.includes('DISPENSING') || l.includes('VERIFIED') ? 'rgba(0,255,178,0.4)' : 'rgba(255,255,255,0.06)'}` }}>{l}</div>
              ))}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', color: '#4A6080', lineHeight: '1.6' }}>
              This is a simulation. For real transactions use the Transactions page.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
