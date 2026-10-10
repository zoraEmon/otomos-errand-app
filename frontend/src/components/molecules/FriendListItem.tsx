import type { ReactNode } from 'react'
import { Avatar, Badge, Button } from '../atoms'

type FriendListItemProps = {
  name: string
  friendCode: string
  avatarSrc?: string
  online?: boolean
  nearby?: boolean
  actionLabel?: string
  onAction?: () => void
  actionIcon?: ReactNode
}

export function FriendListItem({
  actionIcon,
  actionLabel = 'Dispatch command',
  avatarSrc,
  friendCode,
  name,
  nearby = false,
  onAction,
  online = false,
}: FriendListItemProps) {
  return (
    <article className="friend-list-item">
      <Avatar alt={`${name} avatar`} name={name} online={online} size="sm" src={avatarSrc} />
      <div className="friend-list-item__details">
        <strong>{name}</strong>
        <span>Code: {friendCode}</span>
        {nearby && <Badge tone="pending">Nearby</Badge>}
      </div>
      {onAction && <Button className="friend-list-item__action" icon={actionIcon} onClick={onAction} variant="primary">{actionLabel}</Button>}
    </article>
  )
}
