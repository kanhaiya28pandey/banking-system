import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

export const useBalanceSubscription = () => {
  const { user } = useSelector((s: any) => s.auth)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [balances, setBalances] = useState<Map<string, number>>(new Map())
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    if (!user?.id) return

    // Determine WebSocket URL based on current environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/balance-updates?userId=${user.id}`

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl)

        wsRef.current.onopen = () => {
          console.log('WebSocket connected')
          setConnected(true)
        }

        wsRef.current.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'BALANCE_UPDATE') {
              setBalances(prev => {
                const updated = new Map(prev)
                updated.set(data.accountNumber, data.balance)
                return updated
              })
              setLastUpdate(data.timestamp)
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e)
          }
        }

        wsRef.current.onerror = (event: Event) => {
          console.error('WebSocket error:', event)
          setConnected(false)
        }

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected')
          setConnected(false)
          // Attempt reconnection after 5 seconds
          setTimeout(connectWebSocket, 5000)
        }
      } catch (e) {
        console.error('WebSocket connection error:', e)
        setConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [user?.id])

  const getBalance = (accountNumber: string): number | null => {
    return balances.get(accountNumber) || null
  }

  return { connected, getBalance, balances, lastUpdate }
}
