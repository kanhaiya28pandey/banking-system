import { useState } from 'react'
import toast from 'react-hot-toast'
import { exportStatementPdf, exportStatementCsv } from '../api/transactionApi'

interface ExportButtonsProps {
  accountNumber: string
  fromDate?: string
  toDate?: string
}

export default function ExportButtons({ accountNumber, fromDate, toDate }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)

  const handleExportPdf = async () => {
    setExporting('pdf')
    try {
      const response = await exportStatementPdf(accountNumber, fromDate, toDate)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `nexbank-statement-${accountNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Statement downloaded as PDF!')
    } catch (err) {
      toast.error('Failed to export PDF')
    }
    setExporting(null)
  }

  const handleExportCsv = async () => {
    setExporting('csv')
    try {
      const response = await exportStatementCsv(accountNumber, fromDate, toDate)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `nexbank-statement-${accountNumber}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Statement downloaded as CSV!')
    } catch (err) {
      toast.error('Failed to export CSV')
    }
    setExporting(null)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      <button
        onClick={handleExportPdf}
        disabled={exporting !== null}
        style={{
          flex: 1,
          background: 'rgba(245,200,66,0.15)',
          border: '1px solid rgba(245,200,66,0.3)',
          color: '#F5C842',
          borderRadius: '10px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: '700',
          cursor: exporting ? 'not-allowed' : 'pointer',
          opacity: exporting ? 0.7 : 1,
          letterSpacing: '1px',
          transition: 'all 0.3s',
        }}
      >
        {exporting === 'pdf' ? '⏳ EXPORTING...' : '📄 EXPORT PDF'}
      </button>
      <button
        onClick={handleExportCsv}
        disabled={exporting !== null}
        style={{
          flex: 1,
          background: 'rgba(0,255,178,0.15)',
          border: '1px solid rgba(0,255,178,0.3)',
          color: '#00FFB2',
          borderRadius: '10px',
          padding: '12px',
          fontSize: '12px',
          fontWeight: '700',
          cursor: exporting ? 'not-allowed' : 'pointer',
          opacity: exporting ? 0.7 : 1,
          letterSpacing: '1px',
          transition: 'all 0.3s',
        }}
      >
        {exporting === 'csv' ? '⏳ EXPORTING...' : '📊 EXPORT CSV'}
      </button>
    </div>
  )
}
