import type { ReactNode } from 'react'
import { BottomTab } from '../molecules'

type NavigationItem = {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

type BottomNavigationProps = {
  items?: NavigationItem[]
}

const defaultItems: NavigationItem[] = [
  { icon: '⌂', label: 'Home' },
  { icon: '☑', label: 'Errands' },
  { icon: '♧', label: 'Invitations' },
]

export function BottomNavigation({ items = defaultItems }: BottomNavigationProps) {
  return (
    <nav aria-label="Primary navigation" className="bottom-navigation">
      {items.map((item) => <BottomTab key={item.label} {...item} />)}
    </nav>
  )
}
