import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
}

export function IconButton({ className = '', icon, label, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={['icon-button', className].filter(Boolean).join(' ')}
      title={label}
      type="button"
      {...props}
    >
      {icon}
    </button>
  )
}
