import { BottomNavigation } from './BottomNavigation'

type AppNavigationProps = {
  active: 'home' | 'errands' | 'invitations'
  onNavigate: (destination: 'home' | 'errands' | 'invitations') => void
  notificationCount?: number
}

export function AppNavigation({ active, notificationCount = 0, onNavigate }: AppNavigationProps) {
  return (
    <BottomNavigation
      items={[
        { icon: '⌂', label: 'Home', active: active === 'home', onClick: () => onNavigate('home') },
        { icon: '☑', label: 'Errands', active: active === 'errands', onClick: () => onNavigate('errands') },
        {
          icon: <span className="bottom-tab__notification-icon">{'♧'}{notificationCount > 0 && <b>{notificationCount > 9 ? '9+' : notificationCount}</b>}</span>,
          label: 'Invitations',
          active: active === 'invitations',
          onClick: () => onNavigate('invitations'),
        },
      ]}
    />
  )
}
