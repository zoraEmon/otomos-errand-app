import type { ReactNode } from 'react'
import { Button, Card } from '../atoms'
import { SectionHeader } from '../molecules'

type DeliveredItem = {
  id: string
  name: string
  quantity: number
  price?: string
  icon?: ReactNode
}

type DeliveryVerificationProps = {
  items: DeliveredItem[]
  onApprove: () => void
  onReopen?: () => void
  approving?: boolean
}

export function DeliveryVerification({ approving = false, items, onApprove, onReopen }: DeliveryVerificationProps) {
  return (
    <section className="delivery-verification">
      <SectionHeader count={items.length} meta={<span className="helper-text">100% accounted</span>} title="Delivered items" />
      <Card className="delivery-verification__items">
        {items.map((item) => (
          <div className="delivered-item" key={item.id}>
            <span aria-hidden="true" className="delivered-item__check">✓</span>
            <span className="delivered-item__name">{item.name}</span>
            <span className="delivered-item__quantity">Qty: {item.quantity}</span>
            {item.price && <strong>{item.price}</strong>}
          </div>
        ))}
      </Card>
      <Button disabled={approving} fullWidth onClick={onApprove} variant="inverted">
        {approving ? 'Approving...' : 'Approve and close errand'}
      </Button>
      {onReopen && <button className="delivery-verification__reopen" onClick={onReopen} type="button">Reopen / issue adjustment</button>}
    </section>
  )
}

export type { DeliveredItem }
