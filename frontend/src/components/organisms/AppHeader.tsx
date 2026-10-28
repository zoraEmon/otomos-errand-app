import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Avatar, IconButton } from '../atoms'

type AppHeaderProps = {
  title: string
  avatarName?: string
  avatarSrc?: string
  onProfile?: () => void
  onBack?: () => void
  onLogout?: () => void
  action?: ReactNode
}

export function AppHeader({ action, avatarName = 'Profile', avatarSrc, onBack, onLogout, onProfile, title }: AppHeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileMenuOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [profileMenuOpen])

  const toggleProfileMenu = () => {
    setProfileMenuOpen((open) => !open)
    onProfile?.()
  }

  const logout = () => {
    setProfileMenuOpen(false)
    onLogout?.()
  }

  return (
    <header className="app-header">
      {onBack ? <IconButton icon="←" label="Go back" onClick={onBack} /> : <span className="app-header__spacer" />}
      <h1>{title}</h1>
      <div className="app-header__actions">
        {action}
        {(onProfile || onLogout) && (
          <div className="app-header__profile" ref={profileMenuRef}>
            <IconButton
              aria-expanded={profileMenuOpen}
              className={profileMenuOpen ? 'icon-button--active' : ''}
              icon={<Avatar alt={`${avatarName} avatar`} name={avatarName} size="sm" src={avatarSrc} />}
              label="Open profile menu"
              onClick={toggleProfileMenu}
            />
            {profileMenuOpen && (
              <div aria-label="Profile menu" className="profile-menu" role="menu">
                <button className="profile-menu__item profile-menu__item--disabled" disabled role="menuitem" type="button">
                  <span aria-hidden="true" className="profile-menu__icon">⚙</span>
                  <span>Settings</span>
                  <span className="profile-menu__badge">Coming Soon</span>
                </button>
                <div className="profile-menu__divider" />
                <button className="profile-menu__item profile-menu__item--logout" onClick={logout} role="menuitem" type="button">
                  <span aria-hidden="true" className="profile-menu__icon">⇥</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
