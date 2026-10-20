import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ErrandDTO, ErrandItemDTO } from '../../../../shared/contracts/errand.contract'
import { Avatar, Button, IconButton } from '../../components/atoms'
import { ApiError, getErrand, updateErrandItem } from '../../lib/apiClient'

type PendingMutation = {
  errandId: string
  itemId: string
  isBought: boolean
}

const queueKey = 'otomos.errand.pending-item-updates'

function readQueue(): PendingMutation[] {
  try {
    return JSON.parse(window.localStorage.getItem(queueKey) ?? '[]') as PendingMutation[]
  } catch {
    return []
  }
}

function writeQueue(queue: PendingMutation[]) {
  window.localStorage.setItem(queueKey, JSON.stringify(queue))
}

type ActiveErrandPageProps = {
  errandId: string
  onBack: () => void
}

export function ActiveErrandPage({ errandId, onBack }: ActiveErrandPageProps) {
  const [errand, setErrand] = useState<ErrandDTO>()
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(readQueue().length)

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) return
    const queue = readQueue()
    if (!queue.length) {
      setPendingCount(0)
      return
    }
    setSyncing(true)
    const remaining: PendingMutation[] = []
    for (const mutation of queue) {
      try {
        await updateErrandItem(mutation.errandId, mutation.itemId, mutation.isBought)
      } catch {
        remaining.push(mutation)
      }
    }
    writeQueue(remaining)
    setPendingCount(remaining.length)
    setSyncing(false)
  }, [])

  const loadErrand = useCallback(async () => {
    try {
      const response = await getErrand(errandId)
      setErrand(response.errand)
      setError('')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to load this errand.')
    }
  }, [errandId])

  useEffect(() => {
    void loadErrand()
    const goOnline = () => {
      setOffline(false)
      void syncQueue().then(() => loadErrand())
    }
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [loadErrand, syncQueue])

  const boughtCount = useMemo(() => errand?.items.filter((item) => item.isBought).length ?? 0, [errand])
  const totalCount = errand?.items.length ?? 0
  const progress = totalCount ? (boughtCount / totalCount) * 100 : 0

  const toggleItem = async (item: ErrandItemDTO) => {
    const isBought = !item.isBought
    setErrand((current) => current && {
      ...current,
      items: current.items.map((candidate) => candidate.id === item.id ? { ...candidate, isBought } : candidate),
    })
    if (!navigator.onLine) {
      const queue = [...readQueue().filter((mutation) => mutation.itemId !== item.id), { errandId, itemId: item.id, isBought }]
      writeQueue(queue)
      setPendingCount(queue.length)
      return
    }
    try {
      await updateErrandItem(errandId, item.id, isBought)
    } catch {
      const queue = [...readQueue(), { errandId, itemId: item.id, isBought }]
      writeQueue(queue)
      setPendingCount(queue.length)
      setOffline(true)
    }
  }

  if (error && !errand) return <main className="active-errand-page"><p className="commander-alert">{error}</p></main>
  if (!errand) return <main className="active-errand-page"><div className="friends-empty">Loading errand…</div></main>

  return (
    <main className="active-errand-page">
      <header className="active-errand__header">
        <IconButton icon="←" label="Back to errands" onClick={onBack} />
        <h1>Errand #{errand.id.slice(0, 6).toUpperCase()}</h1>
        <span aria-hidden="true">•••</span>
      </header>
      <div className={`sync-status ${offline ? 'sync-status--offline' : ''}`}>
        <span>{offline ? '☁̸' : syncing ? '◌' : '☁'}</span>
        <strong>{offline ? 'Offline – Saved Locally' : syncing ? 'Syncing updates…' : 'Connected – All changes saved'}</strong>
        {pendingCount > 0 && <small>{pendingCount} pending</small>}
      </div>
      <section className="active-errand__commander">
        <Avatar alt="Commander avatar" name="Commander" online size="md" />
        <div><span>ERRAND COMMANDER</span><strong>Otomos Commander</strong><small>{errand.status.replaceAll('_', ' ')}</small></div>
      </section>
      <section className="active-errand__items">
        <div className="active-errand__title">
          <h2>Items checklist</h2><span>{boughtCount} / {totalCount}</span>
        </div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <p className="progress-copy">{boughtCount} of {totalCount} items bought</p>
        <div className="checklist">
          {errand.items.map((item) => (
            <button className={`checklist-row ${item.isBought ? 'checklist-row--bought' : ''}`} key={item.id} onClick={() => void toggleItem(item)} type="button">
              <span className="check-toggle" aria-hidden="true">{item.isBought ? '✓' : ''}</span>
              <span className="checklist-row__content"><strong>{item.itemName} (Qty: {item.quantity})</strong>{item.notes && <small>{item.notes}</small>}</span>
              <span className="checklist-row__handle" aria-hidden="true">=</span>
            </button>
          ))}
        </div>
      </section>
      {errand.instructions && <div className="active-errand__instructions">▣ <span>{errand.instructions}</span></div>}
      <Button className="active-errand__done" disabled={boughtCount !== totalCount} fullWidth variant="primary">✓ Mark errand as done</Button>
    </main>
  )
}
