import { useEffect, useState } from 'react'
import { AuthPage } from './features/auth'
import { CommanderPage } from './features/errands/CommanderPage'
import { ActiveErrandPage } from './features/errands/ActiveErrandPage'
import { FriendsPage } from './features/friends/FriendsPage'
import { ErrandsPage } from './features/errands/ErrandsPage'
import { InvitationsPage } from './features/invitations/InvitationsPage'
import { getPendingConnections, getErrands } from './lib/apiClient'
import { clearAuthToken, getAuthToken } from './lib/authStorage'

function App() {
  return <AppContent />
}

function AppContent() {
  const [authenticated, setAuthenticated] = useState(Boolean(getAuthToken()))
  const [screen, setScreen] = useState<'friends' | 'errands' | 'invitations' | 'errand' | 'active-errand'>(
    window.location.pathname.match(/^\/errands\/[^/]+$/) ? 'active-errand' : window.location.pathname === '/errands' ? 'errands' : window.location.pathname === '/invitations' ? 'invitations' : window.location.pathname.startsWith('/errands') ? 'errand' : 'friends',
  )
  const [runnerId, setRunnerId] = useState<string>()
  const [notificationCount, setNotificationCount] = useState(0)
  const logout = () => {
    clearAuthToken()
    window.history.replaceState({}, '', '/')
    setAuthenticated(false)
  }

  useEffect(() => {
    if (authenticated) {
      void Promise.all([getPendingConnections(), getErrands()])
        .then(([friends, errands]) => setNotificationCount(friends.length + errands.filter((errand) => errand.role === 'runner' && errand.status === 'pending_acceptance').length))
        .catch(() => setNotificationCount(0))
    }
    const handlePopState = () => {
      setScreen(window.location.pathname.match(/^\/errands\/[^/]+$/) ? 'active-errand' : window.location.pathname === '/errands' ? 'errands' : window.location.pathname === '/invitations' ? 'invitations' : window.location.pathname.startsWith('/errands') ? 'errand' : 'friends')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [authenticated])

  const navigate = (destination: 'home' | 'errands' | 'invitations') => {
    const path = destination === 'home' ? '/friends' : `/${destination}`
    window.history.pushState({}, '', path)
    setScreen(destination === 'home' ? 'friends' : destination)
  }

  if (authenticated) {
    if (screen === 'active-errand') {
      const activeErrandId = window.location.pathname.split('/')[2]
      return (
        <ActiveErrandPage
          errandId={activeErrandId}
          notificationCount={notificationCount}
          onBack={() => {
            window.history.pushState({}, '', '/friends')
            setScreen('friends')
          }}
          onNavigate={navigate}
        />
      )
    }
    if (screen === 'errand') {
      return (
        <CommanderPage
          initialRunnerId={runnerId}
          onBack={() => {
            window.history.pushState({}, '', '/friends')
            setScreen('friends')
          }}
          onCreated={() => navigate('errands')}
          notificationCount={notificationCount}
          onNavigate={navigate}
        />
      )
    }
    if (screen === 'errands') {
      return <ErrandsPage notificationCount={notificationCount} onLogout={logout} onNavigate={navigate} onOpenErrand={(id) => { window.history.pushState({}, '', `/errands/${id}`); setScreen('active-errand') }} />
    }
    if (screen === 'invitations') {
      return <InvitationsPage onLogout={logout} onNavigate={navigate} onOpenErrand={(id) => { window.history.pushState({}, '', `/errands/${id}`); setScreen('active-errand') }} />
    }

    return (
      <FriendsPage
        onDispatch={(selectedRunnerId) => {
          setRunnerId(selectedRunnerId)
          window.history.pushState({}, '', '/errands/new')
          setScreen('errand')
        }}
        onLogout={logout}
        notificationCount={notificationCount}
        onNavigate={navigate}
      />
    )
  }

  return <AuthPage onAuthenticated={() => setAuthenticated(true)} />
}

export default App
