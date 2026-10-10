import type { ReactNode } from 'react'
import { SectionHeader } from '../molecules'
import { ErrandItemRow } from '../molecules'

type ChecklistItem = {
  id: string
  name: string
  quantity: number
  completed: boolean
  icon?: ReactNode
}

type ErrandChecklistProps = {
  items: ChecklistItem[]
  targetLabel?: string
  onToggle: (item: ChecklistItem) => void
}

export function ErrandChecklist({ items, onToggle, targetLabel }: ErrandChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length

  return (
    <section className="errand-checklist">
      <SectionHeader meta={targetLabel && <span className="helper-text">{targetLabel}</span>} title="Items checklist" />
      <span className="errand-checklist__progress">{completedCount} / {items.length} complete</span>
      <div className="errand-checklist__items">
        {items.map((item) => (
          <ErrandItemRow key={item.id} {...item} onToggle={() => onToggle(item)} />
        ))}
      </div>
    </section>
  )
}

export type { ChecklistItem }
