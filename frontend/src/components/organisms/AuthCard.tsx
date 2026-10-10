import type { FormEvent, ReactNode } from 'react'
import { Button, Card } from '../atoms'

type AuthCardProps = {
  title: string
  subtitle?: string
  submitLabel: string
  children: ReactNode
  footer?: ReactNode
  logo?: ReactNode
  loading?: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthCard({ children, footer, loading = false, logo, onSubmit, submitLabel, subtitle, title }: AuthCardProps) {
  return (
    <Card className="auth-card">
      {logo && <div className="auth-card__logo">{logo}</div>}
      <div className="auth-card__heading">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <form className="auth-card__form" onSubmit={onSubmit}>
        {children}
        <Button disabled={loading} fullWidth type="submit" variant="secondary">
          {loading ? 'Please wait...' : submitLabel}
        </Button>
      </form>
      {footer && <div className="auth-card__footer">{footer}</div>}
    </Card>
  )
}
