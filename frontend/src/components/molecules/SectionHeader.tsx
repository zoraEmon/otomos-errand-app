import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  count?: number | string
  meta?: ReactNode
  action?: ReactNode
}

export function SectionHeader({ action, count, meta, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header__heading">
        <h2>{title}</h2>
        {count !== undefined && <span className="section-header__count">{count}</span>}
      </div>
      {meta}
      {action}
    </div>
  )
}
