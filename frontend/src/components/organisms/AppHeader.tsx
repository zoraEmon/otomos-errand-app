import type { ReactNode } from 'react'
import { Avatar, IconButton } from '../atoms'

type AppHeaderProps = {
  title: string
  avatarName?: string
  avatarSrc?: string
  onProfile?: () => void
  onBack?: () => void
  action?: ReactNode
}

export function AppHeader({ action, avatarName = 'Profile', avatarSrc, onBack, onProfile, title }: AppHeaderProps) {
  return (
    <header className="app-header">
      {onBack ? <IconButton icon="←" label="Go back" onClick={onBack} /> : <span className="app-header__spacer" />}
      <h1>{title}</h1>
      <div className="app-header__actions">
        {action}
        {onProfile && (
          <IconButton icon={<Avatar alt={`${avatarName} avatar`} name={avatarName} size="sm" src={avatarSrc} />} label="Open profile" onClick={onProfile} />
        )}
      </div>
    </header>
  )
}
