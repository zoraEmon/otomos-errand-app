import { useCallback, useEffect, useState } from 'react'
import { AppNavigation } from '../../components/organisms/AppNavigation'
import { AppHeader } from '../../components/organisms'
import { Avatar, Button } from '../../components/atoms'
import { ApiError, getErrands, type ErrandSummary } from '../../lib/apiClient'

type ErrandsPageProps = {
  onNavigate: (destination: 'home' | 'errands' | 'invitations') => void
  onOpenErrand: (id: string) => void
  notificationCount?: number
  onLogout: () => void
}

export function ErrandsPage({ notificationCount = 0, onLogout, onNavigate, onOpenErrand }: ErrandsPageProps) {
  const [errands, setErrands] = useState<ErrandSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadErrands = useCallback(async () => {
    try {
      setErrands(await getErrands())
      setError('')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to load errands.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadErrands() }, [loadErrands])

  return (
    <main className="app-page">
      <AppHeader avatarName="Profile" onLogout={onLogout} onProfile={() => undefined} title="Errands" />
      <div className="app-page__body">
        <div className="screen-heading">
          <div><span className="friends-label">YOUR ACTIVITY</span><h2>Sent &amp; received errands</h2></div>
          <Button onClick={() => onNavigate('home')} variant="secondary">＋ New</Button>
        </div>
        {error && <div className="friends-message friends-message--error" role="alert">{error}</div>}
        {loading ? <div className="friends-empty">Loading errands…</div> : errands.length === 0 ? (
          <div className="friends-empty"><strong>No errands yet</strong><span>Dispatch an errand from Home to see it here.</span></div>
        ) : (
          <div className="errands-list">
            {errands.map((errand) => (
              <button className="errand-list-card" key={errand.id} onClick={() => onOpenErrand(errand.id)} type="button">
                <Avatar alt={`${errand.otherUser.username} avatar`} name={errand.otherUser.username} size="md" />
                <span className="errand-list-card__details">
                  <strong>{errand.role === 'runner' ? 'Run for' : 'Sent to'} {errand.otherUser.username}</strong>
                  <small>{errand.itemCount} {errand.itemCount === 1 ? 'item' : 'items'} · {errand.status.replaceAll('_', ' ')}</small>
                </span>
                <span className={`errand-status errand-status--${errand.status}`}>{errand.status.replaceAll('_', ' ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <AppNavigation active="errands" notificationCount={notificationCount} onNavigate={onNavigate} />
    </main>
  )
}
