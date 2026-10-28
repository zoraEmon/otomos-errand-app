import { useCallback, useEffect, useState } from 'react'
import { Avatar, Button, IconButton } from '../../components/atoms'
import { AppHeader } from '../../components/organisms'
import { AppNavigation } from '../../components/organisms/AppNavigation'
import {
  acceptConnectionRequest,
  ApiError,
  connectWithFriend,
  getConnectedRunners,
  getPendingConnections,
  rejectConnectionRequest,
  type ConnectedRunner,
  type PendingConnectionRequest,
} from '../../lib/apiClient'
import { getAuthUser } from '../../lib/authStorage'

type FriendsPageProps = {
  onDispatch: (runnerId: string) => void
  onLogout: () => void
  onNavigate: (destination: 'home' | 'errands' | 'invitations') => void
  notificationCount?: number
}

export function FriendsPage({ notificationCount = 0, onDispatch, onLogout, onNavigate }: FriendsPageProps) {
  const [friends, setFriends] = useState<ConnectedRunner[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingConnectionRequest[]>([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' }>()
  const [copied, setCopied] = useState(false)
  const [pendingActionId, setPendingActionId] = useState<string>()
  const user = getAuthUser()

  const loadFriends = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [nextFriends, nextPending] = await Promise.all([getConnectedRunners(), getPendingConnections()])
      setFriends(nextFriends)
      setPendingRequests(nextPending)
    } catch {
      setMessage({ text: 'Unable to load your friends. Please try again.', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  const formatRelativeTime = (createdAt: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 1000))
    if (elapsedSeconds < 60) return 'just now'
    const minutes = Math.floor(elapsedSeconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return days === 1 ? 'yesterday' : `${days}d ago`
  }

  const handlePendingAction = async (request: PendingConnectionRequest, action: 'accept' | 'reject') => {
    if (pendingActionId) return
    setMessage(undefined)
    setPendingActionId(request.id)
    try {
      if (action === 'accept') {
        await acceptConnectionRequest(request.id)
        setMessage({ text: `${request.sender.username} is now your friend.`, tone: 'success' })
        await loadFriends(false)
      } else {
        await rejectConnectionRequest(request.id)
        setPendingRequests((current) => current.filter((item) => item.id !== request.id))
      }
    } catch (error) {
      setMessage({
        text: error instanceof ApiError ? error.message : `Unable to ${action} this request. Please try again.`,
        tone: 'error',
      })
    } finally {
      setPendingActionId(undefined)
    }
  }

  useEffect(() => {
    void loadFriends(false)
  }, [loadFriends])

  const submitConnection = async () => {
    if (code.length !== 7 || submitting) return
    setMessage(undefined)
    setSubmitting(true)
    try {
      await connectWithFriend(code)
      setCode('')
      setMessage({ text: 'Friend linked successfully.', tone: 'success' })
      await loadFriends()
    } catch (error) {
      const text = error instanceof ApiError
        ? error.status === 404
          ? 'No friend was found with that code.'
          : error.status === 400
            ? 'You cannot link your own friend code.'
            : error.status === 409
              ? 'This friend is already linked.'
              : error.message
        : 'Unable to link this friend. Please try again.'
      setMessage({ text, tone: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const copyCode = async () => {
    if (!user?.code7) return
    try {
      await navigator.clipboard.writeText(user.code7)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setMessage({ text: 'Unable to copy your friend code.', tone: 'error' })
    }
  }

  return (
    <main className="friends-page">
      <AppHeader avatarName={user?.username} onLogout={onLogout} onProfile={() => undefined} title="Friends" />

      <div className="friends-page__body">
        <section className="friends-intro">
          <div>
            <h2>OTOMOS</h2>
            <p>Friends &amp; Connection Manager</p>
          </div>
          <button className="friend-code-pill" onClick={() => void copyCode()} type="button">
            ID: {user?.code7 ?? '-------'} <span aria-hidden="true">{copied ? '✓' : '▣'}</span>
          </button>
        </section>

        <section className="friends-connect">
          <span className="friends-label">CONNECT WITH A FRIEND</span>
          <form onSubmit={(event) => { event.preventDefault(); void submitConnection() }}>
            <div className="friends-code-input">
              <span aria-hidden="true">♙</span>
              <input
                aria-label="Friend code"
                maxLength={7}
                onChange={(event) => setCode(event.target.value.replace(/\s/g, '').toUpperCase().slice(0, 7))}
                placeholder="ENTER 7-CHAR ID"
                value={code}
              />
            </div>
            <Button disabled={code.length !== 7 || submitting} type="submit" variant="primary">
              {submitting ? '…' : 'LINK'}
            </Button>
          </form>
        </section>

        {message && <div className={`friends-message friends-message--${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</div>}

        <section className="friends-list-section">
          <div className="friends-list-section__heading">
            <span className="friends-label">MY FRIENDS</span>
            <span className="friends-count">{friends.length} Linked</span>
          </div>
          {loading ? (
            <div className="friends-empty">Loading friends…</div>
          ) : friends.length === 0 ? (
            <div className="friends-empty">
              <strong>No linked friends yet</strong>
              <span>Share your code or enter a friend's code above to get started.</span>
            </div>
          ) : (
            <div className="friends-cards">
              {friends.map((friend, index) => (
                <article className="friend-card" key={friend.id}>
                  <Avatar alt={`${friend.username} avatar`} name={friend.username} online={index % 2 === 0} size="md" />
                  <div className="friend-card__details">
                    <strong>{friend.username}</strong>
                    <span>Code: {friend.code7.slice(0, 4)}...</span>
                  </div>
                  {index === 1 && <span className="friend-card__nearby">NEARBY</span>}
                  <Button className="friend-card__dispatch" onClick={() => onDispatch(friend.id)} variant="secondary">
                    ⚡ Dispatch Command
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>

        {pendingRequests.length > 0 && (
          <section className="friends-pending-section">
            <div className="friends-pending-section__heading">
              <div className="friends-pending-section__title">
                <span className="friends-label">PENDING REQUESTS</span>
                <span className="friends-badge-new">{pendingRequests.length} NEW</span>
              </div>
              <button className="friends-manage-btn" type="button">Manage</button>
            </div>
            <div className="friends-pending-cards">
              {pendingRequests.map((request) => {
                const busy = pendingActionId === request.id
                return (
                  <article className="friends-pending-card" key={request.id}>
                    <Avatar alt={`${request.sender.username} avatar`} name={request.sender.username} online size="md" />
                    <div className="friends-pending-card__details">
                      <div className="friends-pending-card__name">
                        <strong>{request.sender.username}</strong>
                        <span>• {formatRelativeTime(request.createdAt)}</span>
                      </div>
                      <span>Code: {request.sender.code7}</span>
                    </div>
                    <div className="friends-pending-card__actions">
                      <Button
                        className="friends-pending-card__accept"
                        disabled={Boolean(pendingActionId)}
                        onClick={() => void handlePendingAction(request, 'accept')}
                        variant="primary"
                      >
                        {busy ? '…' : '✓ Accept'}
                      </Button>
                      <button
                        aria-label={`Decline request from ${request.sender.username}`}
                        className="friends-reject-btn"
                        disabled={Boolean(pendingActionId)}
                        onClick={() => void handlePendingAction(request, 'reject')}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <IconButton className="friends-refresh" icon="↻" label="Refresh friends" onClick={() => void loadFriends()} />
      </div>
      <AppNavigation active="home" notificationCount={notificationCount} onNavigate={onNavigate} />
    </main>
  )
}
