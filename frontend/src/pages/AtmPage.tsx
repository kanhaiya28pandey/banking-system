import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/Sidebar'
import PinModal from '../components/PinModal'
import toast from 'react-hot-toast'
import api from '../api/axiosInstance'
import { downloadReceipt } from '../api/transactionApi'

export default function AtmPage() {
  const { user } = useSelector((s: any) => s.auth)
  const [input, setInput] = useState('')
  const [balance, setBalance] = useState(0)
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [log, setLog] = useState(['> SESSION STARTED', '> CARD INSERTED', '> PIN VERIFIED: ****'])
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [hasTransactionPin, setHasTransactionPin] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingTransaction, setPendingTransaction] = useState<{ type: 'withdraw' | 'transfer', amount: number } | null>(null)
  const [showQuickTransfer, setShowQuickTransfer] = useState(false)

  const quickTransferAmounts = [5000, 10000, 25000, 50000, 100000]

  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        const res = await api.get(`/account/user/${user.id}`)
        const accs = res.data.data || []
        setAccounts(accs)
        if (accs.length > 0) {
          setSelectedAccount(accs[0].accountNumber)
          setBalance(accs[0].balance || 0)
        }
      } catch {
        addLog('> ERROR: FAILED TO LOAD ACCOUNTS')
      }

      // Check if user has transaction PIN set
      try {
        const pinRes = await api.get(`/user/has-transaction-pin/${user.id}`)
        setHasTransactionPin(pinRes.data.data === true)
      } catch {
        setHasTransactionPin(false)
      }
    }

    loadData()
  }, [user?.id])

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key

      // Number keys 0-9
      if (/^[0-9]$/.test(key)) {
        atmKey(key)
      }
      // Backspace or Delete for CLR
      else if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault()
        atmClear()
      }
      // Enter for WITHDRAW
      else if (key === 'Enter') {
        e.preventDefault()
        withdraw()
      }
      // Space for BALANCE
      else if (key === ' ') {
        e.preventDefault()
        addLog(`> BALANCE: ₹${balance.toLocaleString('en-IN')}`)
        toast.success(`Balance: ₹${balance.toLocaleString('en-IN')}`)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [balance, input, lastTransactionId])

  const addLog = (msg: string) => setLog(p => [...p, msg])
  const atmKey = (v: string) => setInput(p => p + v)
  const atmClear = () => { setInput('') }

  const handleClosePinModal = useCallback(() => {
    setShowPinModal(false)
    setPendingTransaction(null)
  }, [])

  const processPendingTransaction = useCallback(async (pin: string) => {
    if (!pendingTransaction) return

    try {
      const endpoint = pendingTransaction.type === 'withdraw' ? '/transaction/withdraw-with-pin' : '/transaction/transfer-with-pin'
      const body = pendingTransaction.type === 'withdraw'
        ? { accountNumber: selectedAccount, amount: pendingTransaction.amount, transactionPin: pin }
        : { fromAccount: selectedAccount, toAccount: selectedAccount, amount: pendingTransaction.amount, description: 'Quick Transfer', transactionPin: pin }

      const res = await api.post(endpoint, body)

      if (res.data.success) {
        const newBalance = pendingTransaction.type === 'withdraw'
          ? balance - pendingTransaction.amount
          : balance + pendingTransaction.amount
        setBalance(newBalance)
        addLog(`> PIN VERIFIED ✓`)
        addLog(`> ${pendingTransaction.type === 'withdraw' ? 'DISPENSING' : 'QUICK TRANSFER'}: ₹${pendingTransaction.amount.toLocaleString('en-IN')}`)
        addLog(`> NEW BALANCE: ₹${newBalance.toLocaleString('en-IN')}`)
        addLog('> PRINT RECEIPT? (Check bottom)')
        setLastTransactionId(res.data.data.transactionId)
        toast.success(`✓ Transaction successful!`)
      } else {
        addLog('> ERROR: ' + res.data.message)
        toast.error(res.data.message)
      }
    } catch (err: any) {
      addLog('> ERROR: PIN VERIFICATION FAILED')
      toast.error('Transaction failed: ' + (err.response?.data?.message || 'Invalid PIN'))
    }

    setShowPinModal(false)
    setPendingTransaction(null)
    setInput('')
  }, [pendingTransaction, selectedAccount, balance])

  const withdraw = async () => {
    const amt = parseInt(input)
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return }
    if (!selectedAccount) { toast.error('Select account'); return }
    if (amt > balance) {
      addLog('> ERROR: INSUFFICIENT FUNDS')
      toast.error('Insufficient!')
      return
    }

    if (hasTransactionPin) {
      // Show PIN entry modal
      addLog('> TRANSACTION PIN REQUIRED')
      setPendingTransaction({ type: 'withdraw', amount: amt })
      setShowPinModal(true)
    } else {
      // Process directly without PIN
      try {
        const res = await api.post(`/transaction/withdraw?accountNumber=${selectedAccount}&amount=${amt}`, {})
        if (res.data.success) {
          const nb = balance - amt
          setBalance(nb)
          addLog(`> DISPENSING: ₹${amt.toLocaleString('en-IN')}`)
          addLog(`> NEW BALANCE: ₹${nb.toLocaleString('en-IN')}`)
          addLog('> PRINT RECEIPT? (Check bottom)')
          setLastTransactionId(res.data.data.transactionId)
          toast.success(`₹${amt.toLocaleString('en-IN')} withdrawn!`)
        } else {
          addLog('> ERROR: ' + res.data.message)
          toast.error(res.data.message)
        }
      } catch (err: any) {
        addLog('> ERROR: TRANSACTION FAILED')
        toast.error('Withdrawal failed')
      }
      setInput('')
    }
  }

  const deposit = async () => {
    const amt = parseInt(input)
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return }
    if (!selectedAccount) { toast.error('Select account'); return }

    if (hasTransactionPin) {
      // Show PIN entry modal
      addLog('> TRANSACTION PIN REQUIRED')
      setPendingTransaction({ type: 'transfer', amount: amt })
      setShowPinModal(true)
    } else {
      // Process directly without PIN
      try {
        const res = await api.post(`/transaction/transfer?fromAccount=${selectedAccount}&toAccount=${selectedAccount}&amount=${amt}`, {})
        if (res.data.success) {
          const nb = balance + amt
          setBalance(nb)
          addLog(`> QUICK TRANSFER: ₹${amt.toLocaleString('en-IN')}`)
          addLog(`> NEW BALANCE: ₹${nb.toLocaleString('en-IN')}`)
          addLog('> PRINT RECEIPT? (Check bottom)')
          setLastTransactionId(res.data.data.transactionId)
          toast.success(`₹${amt.toLocaleString('en-IN')} transferred!`)
        } else {
          addLog('> ERROR: ' + res.data.message)
          toast.error(res.data.message)
        }
      } catch (err: any) {
        addLog('> ERROR: TRANSACTION FAILED')
        toast.error('Transfer failed')
      }
      setInput('')
      setShowQuickTransfer(false)
    }
  }

  const handlePrintReceipt = async () => {
    if (!lastTransactionId) { toast.error('No receipt available'); return }
    setDownloadingId(lastTransactionId)
    try {
      const response = await downloadReceipt(lastTransactionId)
      const url = window.URL.createObjectURL(response.data)
      const printWindow = window.open(url)
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print()
        })
      }
      addLog('> RECEIPT PRINTED')
      toast.success('Receipt printing...')
    } catch {
      toast.error('Failed to print receipt')
    }
    setDownloadingId(null)
  }

  const handleDownloadReceipt = async () => {
    if (!lastTransactionId) { toast.error('No receipt available'); return }
    setDownloadingId(lastTransactionId)
    try {
      const response = await downloadReceipt(lastTransactionId)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `atm-receipt-${lastTransactionId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      addLog('> RECEIPT DOWNLOADED')
      toast.success('Receipt downloaded!')
    } catch {
      toast.error('Failed to download receipt')
    }
    setDownloadingId(null)
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
          <div style={{ background: 'linear-gradient(170deg, #0A1628, #060A12)', border: '2px solid rgba(245,200,66,0.18)', borderRadius: '28px', padding: '24px' }}>
            {/* Account Selector - Compact */}
            {accounts.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <select value={selectedAccount} onChange={e => {
                  setSelectedAccount(e.target.value)
                  const acc = accounts.find(a => a.accountNumber === e.target.value)
                  if (acc) setBalance(acc.balance || 0)
                }} style={{ width: '100%', background: '#060A12', border: '1px solid rgba(0,255,178,0.3)', borderRadius: '10px', padding: '8px', color: '#00FFB2', fontSize: '11px', outline: 'none', fontWeight: '600' }}>
                  {accounts.map(acc => <option key={acc.id} value={acc.accountNumber} style={{ background: '#060A12', color: '#00FFB2' }}>{acc.accountType}</option>)}
                </select>
              </div>
            )}

            <div style={{ background: '#020810', border: '2px solid rgba(0,255,178,0.2)', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FFB2', display: 'inline-block', boxShadow: '0 0 8px #00FFB2' }} />
                <span style={{ fontSize: '8px', color: '#00FFB2', letterSpacing: '1px' }}>NEXBANK ATM</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#00FFB2', letterSpacing: '-2px', marginBottom: '4px' }}>₹{balance.toLocaleString('en-IN')}</div>
              <div style={{ marginTop: '8px', background: 'rgba(0,255,178,0.05)', border: input ? '1px solid rgba(0,255,178,0.3)' : '1px solid rgba(0,255,178,0.1)', borderRadius: '10px', padding: '10px 12px', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                {input ? <span style={{ fontSize: '18px', fontWeight: '700', color: '#00FFB2', letterSpacing: '3px' }}>₹ {parseInt(input).toLocaleString('en-IN')}</span> : <span style={{ fontSize: '10px', color: 'rgba(0,255,178,0.25)', letterSpacing: '2px' }}>ENTER AMOUNT</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' }}>
              {['1','2','3','4','5','6','7','8','9','CLR','0','00'].map(k => (
                <button key={k} onClick={() => k === 'CLR' ? atmClear() : atmKey(k)} style={{ background: k === 'CLR' ? 'rgba(255,77,109,0.1)' : 'rgba(17,29,48,0.9)', border: `1px solid ${k === 'CLR' ? 'rgba(255,77,109,0.25)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '10px', padding: '12px', fontSize: '16px', fontWeight: '700', color: k === 'CLR' ? '#FF4D6D' : '#F0EFEA', cursor: 'pointer' }}>{k}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <button onClick={withdraw} style={{ background: 'linear-gradient(135deg, #FF4D6D, #E63459)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>↑ WITHDRAW</button>
              <button onClick={() => setShowQuickTransfer(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #3B9EFF, #2E7FCC)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>⇄ QUICK TRANSFER</button>
              <button onClick={() => { addLog(`> BALANCE: ₹${balance.toLocaleString('en-IN')}`); toast.success(`Balance: ₹${balance.toLocaleString('en-IN')}`) }} style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)', color: '#060A12', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>BALANCE</button>
            </div>

            {/* Receipt Buttons */}
            {lastTransactionId && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button onClick={handleDownloadReceipt} disabled={downloadingId === lastTransactionId} style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', color: '#F5C842', borderRadius: '8px', padding: '10px', fontSize: '9px', fontWeight: '600', cursor: downloadingId ? 'not-allowed' : 'pointer', opacity: downloadingId ? 0.7 : 1, letterSpacing: '0.5px' }}>
                  {downloadingId === lastTransactionId ? '⏳' : '📥'} PDF
                </button>
                <button onClick={handlePrintReceipt} disabled={downloadingId === lastTransactionId} style={{ background: 'rgba(59,158,255,0.15)', border: '1px solid rgba(59,158,255,0.3)', color: '#3B9EFF', borderRadius: '8px', padding: '10px', fontSize: '9px', fontWeight: '600', cursor: downloadingId ? 'not-allowed' : 'pointer', opacity: downloadingId ? 0.7 : 1, letterSpacing: '0.5px' }}>
                  {downloadingId === lastTransactionId ? '⏳' : '🖨️'} PRINT
                </button>
              </div>
            )}

            {/* Keyboard Hints */}
            <div style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.15)', borderRadius: '8px', padding: '8px', marginTop: '8px', fontSize: '8px', color: '#00FFB2', letterSpacing: '0.5px', lineHeight: '1.3' }}>
              ⌨️ 0-9: Type • ⌫: Clear • ↵: Withdraw • Space: Balance
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
              This ATM is connected to your real accounts. Withdrawals create actual transactions.
            </div>
          </div>
        </div>
      </main>

      <PinModal
        isOpen={showPinModal}
        onClose={handleClosePinModal}
        onConfirm={processPendingTransaction}
        title="ATM TRANSACTION PIN"
        description="Enter your 4-digit PIN to complete the transaction"
      />

      {showQuickTransfer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '16px' }}>
          <div style={{ background: 'linear-gradient(160deg, #0D1829, #080E1A)', border: '2px solid rgba(59,158,255,0.3)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: '14px', color: '#3B9EFF', fontWeight: '700', marginBottom: '8px', letterSpacing: '2px' }}>QUICK TRANSFER</div>
            <div style={{ fontSize: '12px', color: '#4A6080', marginBottom: '24px' }}>Select amount to transfer</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {quickTransferAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    setInput(amt.toString())
                    deposit()
                    setShowQuickTransfer(false)
                  }}
                  style={{
                    background: 'rgba(59,158,255,0.1)',
                    border: '1px solid rgba(59,158,255,0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#3B9EFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    letterSpacing: '1px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,158,255,0.2)'
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(59,158,255,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(59,158,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowQuickTransfer(false)}
              style={{
                width: '100%',
                background: 'rgba(255,77,109,0.1)',
                border: '1px solid rgba(255,77,109,0.3)',
                color: '#FF4D6D',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '2px'
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
