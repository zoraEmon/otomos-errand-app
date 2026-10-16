import { useCallback, useEffect, useState } from 'react'
import { Avatar, Button, IconButton } from '../../components/atoms'
import { ApiError, connectWithFriend, getConnectedRunners, type ConnectedRunner } from '../../lib/apiClient'
import { getAuthUser } from '../../lib/authStorage'

type FriendsPageProps = {
  onDispatch: (runnerId: string) => void
}

export function FriendsPage({ onDispatch }: FriendsPageProps) {
  const [friends, setFriends] = useState<ConnectedRunner[]>([])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' }>()
  const [copied, setCopied] = useState(false)
  const user = getAuthUser()

  const loadFriends = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      setFriends(await getConnectedRunners())
    } catch {
      setMessage({ text: 'Unable to load your friends. Please try again.', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

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
      <header className="friends-page__nav">
        <h1>Friends</h1>
        <span className="friends-page__profile" aria-label="Active user">♙</span>
      </header>

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

        <IconButton className="friends-refresh" icon="↻" label="Refresh friends" onClick={() => void loadFriends()} />
      </div>
    </main>
  )
}
