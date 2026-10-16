import { useEffect, useRef, useState } from 'react'
import type { CreateErrandInput } from '../../../../shared/contracts/errand.contract'
import { Avatar, Button, Card, IconButton } from '../../components/atoms'
import { ApiError, createErrand, getConnectedRunners, type ConnectedRunner } from '../../lib/apiClient'

type DraftItem = {
  id: number
  itemName: string
  quantity: number
  notes: string
}

const newItem = (id: number): DraftItem => ({ id, itemName: '', quantity: 1, notes: '' })

export function CommanderPage() {
  const [runners, setRunners] = useState<ConnectedRunner[]>([])
  const [selectedRunnerId, setSelectedRunnerId] = useState('')
  const [items, setItems] = useState<DraftItem[]>([newItem(1)])
  const [instructions, setInstructions] = useState('')
  const [loadingRunners, setLoadingRunners] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const nextItemId = useRef(2)
  const firstItemInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    getConnectedRunners()
      .then((connectedRunners) => {
        if (!active) return
        setRunners(connectedRunners)
        setSelectedRunnerId(connectedRunners[0]?.id ?? '')
      })
      .catch(() => {
        if (active) setError('Unable to load your connected runners. Please try again.')
      })
      .finally(() => {
        if (active) setLoadingRunners(false)
      })
    return () => { active = false }
  }, [])

  const selectedRunner = runners.find((runner) => runner.id === selectedRunnerId)
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const hasInvalidItem = items.some((item) => !item.itemName.trim() || item.quantity < 1)
  const canSubmit = Boolean(selectedRunnerId) && items.length > 0 && !hasInvalidItem && !submitting

  const updateItem = (id: number, update: Partial<DraftItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item))
  }

  const addItem = () => {
    const id = nextItemId.current++
    setItems((current) => [...current, newItem(id)])
    window.setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('[data-item-name]')
      inputs[inputs.length - 1]?.focus()
    }, 0)
  }

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const submit = async () => {
    if (!canSubmit) {
      setError(items.length === 0 ? 'Add at least one item before dispatching.' : 'Complete each item name and quantity before dispatching.')
      return
    }

    setError('')
    setSuccess('')
    setSubmitting(true)
    const payload: CreateErrandInput = {
      runnerId: selectedRunnerId,
      instructions: instructions.trim() || undefined,
      items: items.map(({ itemName, notes, quantity }) => ({
        itemName: itemName.trim(),
        notes: notes.trim() || undefined,
        quantity,
      })),
    }

    try {
      const response = await createErrand(payload)
      setSuccess(`Errand dispatched to ${selectedRunner?.username ?? 'your runner'}.`)
      setItems([newItem(nextItemId.current++)])
      setInstructions('')
      // This is the tracking destination until a dedicated detail route is available.
      window.history.replaceState({}, '', `/errands/${response.errand.id}`)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Unable to dispatch this errand. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="commander-page">
      <header className="commander-header">
        <IconButton icon="←" label="Go back" onClick={() => window.history.back()} />
        <div>
          <span className="commander-header__eyebrow">COMMANDER</span>
          <h1>Create Errand</h1>
        </div>
        <span className="commander-header__avatar" aria-hidden="true">●</span>
      </header>

      <div className="commander-page__body">
        <section className="commander-section">
          <div className="commander-section__heading">
            <div>
              <span className="commander-section__eyebrow">TARGET RUNNER</span>
              <h2>Who should run this?</h2>
            </div>
            <span className="commander-section__step">1 / 3</span>
          </div>
          {loadingRunners ? (
            <div className="commander-state">Loading your connected runners…</div>
          ) : runners.length === 0 ? (
            <div className="commander-empty">
              <span className="commander-empty__icon">＋</span>
              <strong>No connected runners yet</strong>
              <p>Connect with a friend before sending an errand their way.</p>
            </div>
          ) : (
            <div className="runner-list" role="list">
              {runners.map((runner) => (
                <button
                  aria-pressed={runner.id === selectedRunnerId}
                  className={`runner-option ${runner.id === selectedRunnerId ? 'runner-option--selected' : ''}`}
                  key={runner.id}
                  onClick={() => setSelectedRunnerId(runner.id)}
                  type="button"
                >
                  <Avatar alt={`${runner.username} avatar`} name={runner.username} size="sm" />
                  <span className="runner-option__details">
                    <strong>{runner.username}</strong>
                    <small>Code: {runner.code7}</small>
                  </span>
                  <span className="runner-option__check" aria-hidden="true">{runner.id === selectedRunnerId ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="commander-section">
          <div className="commander-section__heading">
            <div>
              <span className="commander-section__eyebrow">ITEMS TO BUY</span>
              <h2>Build your list</h2>
            </div>
            <span className="commander-section__counter">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="item-list">
            {items.map((item, index) => (
              <Card className="item-row" key={item.id}>
                <span className="item-row__number">{String(index + 1).padStart(2, '0')}</span>
                <div className="item-row__fields">
                  <input
                    aria-label={`Item ${index + 1} name`}
                    className="item-row__name"
                    data-item-name
                    onChange={(event) => updateItem(item.id, { itemName: event.target.value })}
                    placeholder="Item name"
                    ref={index === 0 ? firstItemInput : undefined}
                    value={item.itemName}
                  />
                  <input
                    aria-label={`Notes for ${item.itemName || `item ${index + 1}`}`}
                    className="item-row__notes"
                    onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                    placeholder="Add a note (optional)"
                    value={item.notes}
                  />
                </div>
                <div className="quantity-control">
                  <button aria-label={`Decrease quantity for item ${index + 1}`} disabled={item.quantity <= 1} onClick={() => updateItem(item.id, { quantity: item.quantity - 1 })} type="button">−</button>
                  <output>{item.quantity}</output>
                  <button aria-label={`Increase quantity for item ${index + 1}`} onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })} type="button">＋</button>
                </div>
                <button aria-label={`Delete ${item.itemName || `item ${index + 1}`}`} className="item-row__delete" onClick={() => removeItem(item.id)} type="button">×</button>
              </Card>
            ))}
          </div>
          <Button className="add-item-button" onClick={addItem} variant="secondary">＋ Add another item</Button>
          <p className="commander-summary">{totalItems} total {totalItems === 1 ? 'item' : 'items'} · {items.length} distinct</p>
        </section>

        <section className="commander-section">
          <div className="commander-section__heading">
            <div>
              <span className="commander-section__eyebrow">FINAL DETAILS</span>
              <h2>Instructions</h2>
            </div>
            <span className="commander-section__step">3 / 3</span>
          </div>
          <textarea
            aria-label="General errand instructions"
            className="commander-textarea"
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Drop-off point, preferred market, or anything else your runner should know…"
            rows={3}
            value={instructions}
          />
        </section>

        {error && <div className="commander-alert" role="alert">{error}</div>}
        {success && <div className="commander-success" role="status">{success} Tracking is ready.</div>}

        <Button className="dispatch-button" disabled={!canSubmit} fullWidth onClick={() => void submit()} variant="primary">
          {submitting ? <><span className="loading-spinner" aria-hidden="true" /> Dispatching…</> : <>⚡ Dispatch command</>}
        </Button>
      </div>
    </main>
  )
}
