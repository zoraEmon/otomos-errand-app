import type { ReactNode } from 'react'
import { Button } from '../atoms'
import { ErrandItemRow, SectionHeader } from '../molecules'

type EditableItem = {
  id: string
  name: string
  quantity: number
  icon?: ReactNode
}

type ErrandItemEditorProps = {
  items: EditableItem[]
  quickAdds?: string[]
  onAddItem?: () => void
  onQuickAdd?: (name: string) => void
  onIncrease?: (item: EditableItem) => void
  onDecrease?: (item: EditableItem) => void
  onRemove?: (item: EditableItem) => void
}

export function ErrandItemEditor({
  items,
  onAddItem,
  onDecrease,
  onIncrease,
  onQuickAdd,
  onRemove,
  quickAdds = [],
}: ErrandItemEditorProps) {
  return (
    <section className="errand-item-editor">
      <SectionHeader count={`${items.length} items`} title="Items to buy" />
      <div className="errand-item-editor__items">
        {items.map((item) => (
          <div className="errand-item-editor__row" key={item.id}>
            <ErrandItemRow
              icon={item.icon}
              name={item.name}
              onDecrease={onDecrease ? () => onDecrease(item) : undefined}
              onIncrease={onIncrease ? () => onIncrease(item) : undefined}
              quantity={item.quantity}
            />
            {onRemove && <button className="errand-item-editor__remove" onClick={() => onRemove(item)} type="button">Remove</button>}
          </div>
        ))}
      </div>
      {onAddItem && <Button fullWidth onClick={onAddItem} variant="secondary">+ Add another item</Button>}
      {quickAdds.length > 0 && (
        <div className="quick-adds" aria-label="Quick add items">
          {quickAdds.map((name) => <button key={name} onClick={() => onQuickAdd?.(name)} type="button">+ {name}</button>)}
        </div>
      )}
    </section>
  )
}

export type { EditableItem }
