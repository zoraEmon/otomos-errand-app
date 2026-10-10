import type { ReactNode } from 'react'

type DeliverySummaryProps = {
  deliveryTime: string
  estimatedTotal?: string
  destination?: string
  icon?: ReactNode
}

export function DeliverySummary({ deliveryTime, destination, estimatedTotal, icon = '⌁' }: DeliverySummaryProps) {
  return (
    <div className="delivery-summary">
      <span aria-hidden="true" className="delivery-summary__icon">{icon}</span>
      <div>
        <span className="delivery-summary__label">Delivery ETA</span>
        <strong>{deliveryTime}</strong>
        {destination && <span>{destination}</span>}
      </div>
      {estimatedTotal && (
        <div className="delivery-summary__total">
          <span>Estimated total</span>
          <strong>{estimatedTotal}</strong>
        </div>
      )}
    </div>
  )
}
