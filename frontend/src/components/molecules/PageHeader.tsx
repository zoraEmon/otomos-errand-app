import type { ReactNode } from 'react'
import { IconButton } from '../atoms'

type PageHeaderProps = {
  title: string
  onBack?: () => void
  backIcon?: ReactNode
  action?: ReactNode
}

export function PageHeader({ action, backIcon = '←', onBack, title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__side">
        {onBack && <IconButton icon={backIcon} label="Go back" onClick={onBack} />}
      </div>
      <h1 className="page-header__title">{title}</h1>
      <div className="page-header__side page-header__side--right">{action}</div>
    </header>
  )
}
