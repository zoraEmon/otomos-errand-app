import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ErrandDTO, ErrandItemDTO } from '../../../../shared/contracts/errand.contract'
import { Avatar, Button, IconButton } from '../../components/atoms'
import { AppNavigation } from '../../components/organisms/AppNavigation'
import { ApiError, getErrand, updateErrandItem } from '../../lib/apiClient'
import { getAuthUser } from '../../lib/authStorage'
import {
  getCachedErrand,
  getPendingMutations,
  removePendingMutation,
  saveCachedErrand,
  savePendingMutation,
} from '../../lib/errandOfflineStore'

type ActiveErrandPageProps = {
  errandId: string
  onBack: () => void
  onNavigate?: (destination: 'home' | 'errands' | 'invitations') => void
  notificationCount?: number
}

export function ActiveErrandPage({ errandId, notificationCount = 0, onBack, onNavigate }: ActiveErrandPageProps) {
  const queryClient = useQueryClient()
  const [errand, setErrand] = useState<ErrandDTO>()
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const errandQueryKey = useMemo(() => ['errand', errandId], [errandId])

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine) return
    const queue = await getPendingMutations(errandId)
    if (!queue.length) {
      setPendingCount(0)
      setSyncing(false)
      return
    }
    setSyncing(true)
    for (const mutation of queue) {
      try {
        await updateErrandItem(mutation.errandId, mutation.itemId, mutation.isBought)
        await removePendingMutation(mutation.id)
      } catch {
        setOffline(true)
        setSyncing(false)
        return
      }
    }
    const nextPendingCount = (await getPendingMutations(errandId)).length
    setPendingCount(nextPendingCount)
    setSyncing(false)
  }, [errandId])

  const applyPendingMutations = (source: ErrandDTO, mutations: Awaited<ReturnType<typeof getPendingMutations>>) => ({
    ...source,
    items: source.items.map((item) => {
      const mutation = mutations.find((candidate) => candidate.itemId === item.id)
      return mutation ? { ...item, isBought: mutation.isBought } : item
    }),
  })

  const loadErrand = useCallback(async () => {
    const cachedErrand = await getCachedErrand(errandId)
    const cachedMutations = await getPendingMutations(errandId)
    if (cachedErrand) {
      const next = applyPendingMutations(cachedErrand, cachedMutations)
      setErrand(next)
      queryClient.setQueryData(errandQueryKey, next)
    }
    setPendingCount(cachedMutations.length)

    try {
      const response = await getErrand(errandId)
      const mutations = await getPendingMutations(errandId)
      const nextErrand = applyPendingMutations(response.errand, mutations)
      setErrand(nextErrand)
      queryClient.setQueryData(errandQueryKey, nextErrand)
      await saveCachedErrand(nextErrand)
      setError('')
    } catch (caughtError) {
      if (!cachedErrand) {
        setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to load this errand.')
      }
    }
  }, [errandId, errandQueryKey, queryClient])

  useEffect(() => {
    void loadErrand().then(() => syncQueue())
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
  const isPendingRunner = Boolean(errand && errand.runnerId === getAuthUser()?.id && errand.status === 'pending_acceptance')

  const toggleItem = async (item: ErrandItemDTO) => {
    const isBought = !item.isBought
    const nextErrand = errand && {
      ...errand,
      items: errand.items.map((candidate) => candidate.id === item.id ? { ...candidate, isBought } : candidate),
    }

    if (nextErrand) {
      setErrand(nextErrand)
      queryClient.setQueryData(errandQueryKey, nextErrand)
      await saveCachedErrand(nextErrand)
    }

    await savePendingMutation(errandId, item.id, isBought)
    const nextPendingCount = (await getPendingMutations(errandId)).length
    setPendingCount(nextPendingCount)

    if (!navigator.onLine) {
      setOffline(true)
      return
    }

    try {
      await syncQueue()
    } catch {
      setOffline(true)
    }
  }

  if (error && !errand) {
    return (
      <main className="active-errand-page">
        <p className="commander-alert">{error}</p>
        {onNavigate && <AppNavigation active="errands" notificationCount={notificationCount} onNavigate={onNavigate} />}
      </main>
    )
  }
  if (!errand) {
    return (
      <main className="active-errand-page">
        <div className="friends-empty">Loading errand…</div>
        {onNavigate && <AppNavigation active="errands" notificationCount={notificationCount} onNavigate={onNavigate} />}
      </main>
    )
  }
  if (isPendingRunner) {
    return (
      <main className="active-errand-page">
        <header className="active-errand__header">
          <IconButton icon="←" label="Back to errands" onClick={onBack} />
          <h1>Errand invitation</h1>
          <span aria-hidden="true">•••</span>
        </header>
        <section className="errand-invitation-prompt">
          <span aria-hidden="true" className="errand-invitation-prompt__icon">✉</span>
          <h2>You have an errand invitation</h2>
          <p>Accept this invitation from the Invitations tab before you start shopping.</p>
          {onNavigate && <Button onClick={() => onNavigate('invitations')} variant="primary">View invitation</Button>}
        </section>
        {onNavigate && <AppNavigation active="errands" notificationCount={notificationCount} onNavigate={onNavigate} />}
      </main>
    )
  }

  return (
    <main className="active-errand-page">
      <header className="active-errand__header">
        <IconButton icon="←" label="Back to errands" onClick={onBack} />
        <h1>Errand #{errand.id.slice(0, 6).toUpperCase()}</h1>
        <span aria-hidden="true">•••</span>
      </header>
      <div aria-live="polite" className={`sync-status ${offline ? 'sync-status--offline' : ''}`} role="status">
        <span className={syncing ? 'sync-status__spinner' : ''}>{offline ? '☁̸' : syncing ? '◌' : '☁'}</span>
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
            <button
              aria-pressed={item.isBought}
              aria-label={`${item.itemName}, ${item.isBought ? 'bought' : 'not bought'}`}
              className={`checklist-row ${item.isBought ? 'checklist-row--bought' : ''}`}
              key={item.id}
              onClick={() => void toggleItem(item)}
              type="button"
            >
              <span className="check-toggle" aria-hidden="true">{item.isBought ? '✓' : ''}</span>
              <span className="checklist-row__content"><strong>{item.itemName} (Qty: {item.quantity})</strong>{item.notes && <small>{item.notes}</small>}</span>
              <span className="checklist-row__handle" aria-hidden="true">=</span>
            </button>
          ))}
        </div>
      </section>
      {errand.instructions && <div className="active-errand__instructions">▣ <span>{errand.instructions}</span></div>}
      <Button className="active-errand__done" disabled={boughtCount !== totalCount} fullWidth variant="primary">✓ Mark errand as done</Button>
      {onNavigate && <AppNavigation active="errands" notificationCount={notificationCount} onNavigate={onNavigate} />}
    </main>
  )
}
