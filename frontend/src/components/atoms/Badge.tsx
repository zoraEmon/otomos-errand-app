import type { HTMLAttributes, ReactNode } from 'react'

type BadgeTone = 'success' | 'pending' | 'neutral'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, className = '', tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span className={['status-badge', `status-badge--${tone}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}
