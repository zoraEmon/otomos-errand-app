import type { ReactNode } from 'react'
import { Avatar, Badge } from '../atoms'

type UserSummaryProps = {
  name: string
  friendCode?: string
  avatarSrc?: string
  online?: boolean
  badge?: ReactNode
  action?: ReactNode
}

export function UserSummary({ action, avatarSrc, badge, friendCode, name, online = false }: UserSummaryProps) {
  return (
    <div className="user-summary">
      <Avatar alt={`${name} avatar`} name={name} online={online} size="md" src={avatarSrc} />
      <div className="user-summary__details">
        <strong>{name}</strong>
        {friendCode && <span>Code: {friendCode}</span>}
        {badge}
      </div>
      {action}
    </div>
  )
}

export function UserStatusBadge({ children }: { children: ReactNode }) {
  return <Badge tone="neutral">{children}</Badge>
}
