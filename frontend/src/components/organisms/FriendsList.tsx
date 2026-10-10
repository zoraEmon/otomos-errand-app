import type { ReactNode } from 'react'
import { FriendListItem, SectionHeader } from '../molecules'

type Friend = {
  id: string
  name: string
  friendCode: string
  avatarSrc?: string
  online?: boolean
  nearby?: boolean
}

type FriendsListProps = {
  friends: Friend[]
  onDispatch?: (friend: Friend) => void
  emptyState?: ReactNode
}

export function FriendsList({ emptyState = 'No friends connected yet.', friends, onDispatch }: FriendsListProps) {
  return (
    <section className="friends-list">
      <SectionHeader count={friends.length} title="My friends" />
      {friends.length === 0 ? (
        <div className="friends-list__empty">{emptyState}</div>
      ) : (
        <div className="friends-list__items">
          {friends.map((friend) => (
            <FriendListItem key={friend.id} {...friend} onAction={onDispatch ? () => onDispatch(friend) : undefined} />
          ))}
        </div>
      )}
    </section>
  )
}

export type { Friend }
