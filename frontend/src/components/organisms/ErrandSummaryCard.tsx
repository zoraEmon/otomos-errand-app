import type { ReactNode } from 'react'
import { Badge, Card } from '../atoms'
import { UserSummary } from '../molecules'

type ErrandSummaryCardProps = {
  roleLabel: string
  personName: string
  friendCode?: string
  status: string
  statusTone?: 'success' | 'pending' | 'neutral'
  avatarSrc?: string
  online?: boolean
  action?: ReactNode
}

export function ErrandSummaryCard({
  action,
  avatarSrc,
  friendCode,
  online,
  personName,
  roleLabel,
  status,
  statusTone = 'neutral',
}: ErrandSummaryCardProps) {
  return (
    <Card className="errand-summary-card">
      <span className="errand-summary-card__role">{roleLabel}</span>
      <UserSummary
        action={action}
        avatarSrc={avatarSrc}
        badge={<Badge tone={statusTone}>{status}</Badge>}
        friendCode={friendCode}
        name={personName}
        online={online}
      />
    </Card>
  )
}
