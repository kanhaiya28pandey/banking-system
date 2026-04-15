import { useState } from 'react'

interface FilterState {
  accountNumber?: string
  fromDate?: string
  toDate?: string
  minAmount?: number
  maxAmount?: number
  transactionType?: string
  status?: string
}

interface TransactionFiltersProps {
  accounts: any[]
  onApply: (filters: FilterState) => void
  isLoading?: boolean
}

export default function TransactionFilters({ accounts, onApply, isLoading }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    accountNumber: accounts.length > 0 ? accounts[0].accountNumber : '',
    transactionType: '',
    status: '',
  })
  const [isExpanded, setIsExpanded] = useState(false)

  const handleApply = () => {
    onApply(filters)
  }

  const handleReset = () => {
    const reset = {
      accountNumber: accounts.length > 0 ? accounts[0].accountNumber : '',
      transactionType: '',
      status: '',
    }
    setFilters(reset)
    onApply(reset)
  }

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }))
  }

  const inp: any = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#F0EFEA',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          background: 'rgba(245,200,66,0.08)',
          border: '1px solid rgba(245,200,66,0.2)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#F5C842',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          letterSpacing: '1px',
        }}
      >
        <span>🔍 ADVANCED FILTERS</span>
        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: '12px',
            background: 'rgba(10,18,32,0.5)',
            border: '1px solid rgba(245,200,66,0.15)',
            borderRadius: '12px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              FROM DATE
            </label>
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={e => handleChange('fromDate', e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              TO DATE
            </label>
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={e => handleChange('toDate', e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              MIN AMOUNT (₹)
            </label>
            <input
              type="number"
              value={filters.minAmount || ''}
              onChange={e => handleChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0"
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              MAX AMOUNT (₹)
            </label>
            <input
              type="number"
              value={filters.maxAmount || ''}
              onChange={e => handleChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="No limit"
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              TRANSACTION TYPE
            </label>
            <select value={filters.transactionType || ''} onChange={e => handleChange('transactionType', e.target.value)} style={inp}>
              <option value="">All Types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: '#4A6080', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
              STATUS
            </label>
            <select value={filters.status || ''} onChange={e => handleChange('status', e.target.value)} style={inp}>
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleApply}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #00FFB2, #00FFB2BB)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                color: '#060A12',
                fontWeight: '700',
                fontSize: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                letterSpacing: '1px',
              }}
            >
              {isLoading ? '⏳' : '✓'} APPLY FILTERS
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px',
                color: '#F0EFEA',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              ↺ RESET
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
