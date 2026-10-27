import { useCallback, useEffect, useState } from 'react'
import { AppNavigation } from '../../components/organisms/AppNavigation'
import { AppHeader } from '../../components/organisms'
import { Avatar, Button } from '../../components/atoms'
import {
  acceptConnectionRequest,
  acceptErrandRequest,
  ApiError,
  getPendingConnections,
  getErrands,
  rejectConnectionRequest,
  rejectErrandRequest,
  type ErrandSummary,
  type PendingConnectionRequest,
} from '../../lib/apiClient'

type InvitationsPageProps = {
  onNavigate: (destination: 'home' | 'errands' | 'invitations') => void
  onLogout: () => void
  onOpenErrand: (id: string) => void
}

export function InvitationsPage({ onLogout, onNavigate, onOpenErrand }: InvitationsPageProps) {
  const [friends, setFriends] = useState<PendingConnectionRequest[]>([])
  const [errands, setErrands] = useState<ErrandSummary[]>([])
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [pendingFriends, allErrands] = await Promise.all([getPendingConnections(), getErrands()])
      setFriends(pendingFriends)
      setErrands(allErrands.filter((errand) => errand.role === 'runner' && errand.status === 'pending_acceptance'))
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to load invitations.')
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const act = async (id: string, action: 'accept-friend' | 'reject-friend' | 'accept-errand' | 'reject-errand') => {
    setBusy(id)
    try {
      if (action === 'accept-friend') await acceptConnectionRequest(id)
      if (action === 'reject-friend') await rejectConnectionRequest(id)
      if (action === 'accept-errand') await acceptErrandRequest(id)
      if (action === 'reject-errand') await rejectErrandRequest(id)
      await load()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to update invitation.')
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <main className="app-page">
      <AppHeader avatarName="Profile" onLogout={onLogout} onProfile={() => undefined} title="Invitations" />
      <div className="app-page__body">
        {error && <div className="friends-message friends-message--error" role="alert">{error}</div>}
        <section className="invitation-section">
          <div className="screen-heading"><div><span className="friends-label">FRIEND REQUESTS</span><h2>{friends.length} pending</h2></div></div>
          {friends.length === 0 ? <div className="friends-empty">No friend requests right now.</div> : friends.map((request) => (
            <article className="invitation-card" key={request.id}>
              <Avatar alt={`${request.sender.username} avatar`} name={request.sender.username} size="md" />
              <div><strong>{request.sender.username}</strong><small>Code: {request.sender.code7}</small></div>
              <Button disabled={Boolean(busy)} onClick={() => void act(request.id, 'accept-friend')} variant="primary">{busy === request.id ? '…' : 'Accept'}</Button>
              <button aria-label={`Decline ${request.sender.username}`} className="friends-reject-btn" disabled={Boolean(busy)} onClick={() => void act(request.id, 'reject-friend')} type="button">×</button>
            </article>
          ))}
        </section>
        <section className="invitation-section">
          <div className="screen-heading"><div><span className="friends-label">ERRAND INVITATIONS</span><h2>{errands.length} pending</h2></div></div>
          {errands.length === 0 ? <div className="friends-empty">No errand invitations right now.</div> : errands.map((errand) => (
            <article className="invitation-card" key={errand.id}>
              <Avatar alt={`${errand.otherUser.username} avatar`} name={errand.otherUser.username} size="md" />
              <div><strong>Errand from {errand.otherUser.username}</strong><small>{errand.itemCount} items</small></div>
              <Button disabled={Boolean(busy)} onClick={() => void act(errand.id, 'accept-errand')} variant="primary">{busy === errand.id ? '…' : 'Accept'}</Button>
              <button aria-label="Decline errand" className="friends-reject-btn" disabled={Boolean(busy)} onClick={() => void act(errand.id, 'reject-errand')} type="button">×</button>
              <button className="invitation-card__open" onClick={() => onOpenErrand(errand.id)} type="button">View</button>
            </article>
          ))}
        </section>
      </div>
      <AppNavigation active="invitations" notificationCount={friends.length + errands.length} onNavigate={onNavigate} />
    </main>
  )
}
