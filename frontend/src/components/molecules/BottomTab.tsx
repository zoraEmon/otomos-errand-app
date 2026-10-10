import type { ReactNode } from 'react'

type BottomTabProps = {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

export function BottomTab({ active = false, icon, label, onClick }: BottomTabProps) {
  return (
    <button aria-current={active ? 'page' : undefined} className={['bottom-tab', active ? 'bottom-tab--active' : ''].filter(Boolean).join(' ')} onClick={onClick} type="button">
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
