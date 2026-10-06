import type { ReactNode } from 'react'
import { IconButton } from '../atoms'

type ErrandItemRowProps = {
  name: string
  quantity: number
  icon?: ReactNode
  completed?: boolean
  onIncrease?: () => void
  onDecrease?: () => void
  onToggle?: () => void
}

export function ErrandItemRow({
  completed = false,
  icon = '◌',
  name,
  onDecrease,
  onIncrease,
  onToggle,
  quantity,
}: ErrandItemRowProps) {
  return (
    <div className={['errand-item-row', completed ? 'errand-item-row--completed' : ''].filter(Boolean).join(' ')}>
      <button aria-label={`${completed ? 'Mark' : 'Complete'} ${name}`} className="errand-item-row__check" onClick={onToggle} type="button">
        {completed ? '✓' : icon}
      </button>
      <span className="errand-item-row__name">{name}</span>
      {(onDecrease || onIncrease) && (
        <div className="errand-item-row__quantity">
          <IconButton disabled={!onDecrease || quantity <= 1} icon="−" label={`Decrease ${name} quantity`} onClick={onDecrease} />
          <span>{quantity}</span>
          <IconButton disabled={!onIncrease} icon="+" label={`Increase ${name} quantity`} onClick={onIncrease} />
        </div>
      )}
    </div>
  )
}
