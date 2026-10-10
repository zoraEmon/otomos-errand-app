import type { FormEvent } from 'react'
import { Button } from '../atoms'

type FriendCodeInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  error?: string
}

export function FriendCodeInput({ disabled = false, error, onChange, onSubmit, value }: FriendCodeInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="friend-code-input" onSubmit={handleSubmit}>
      <label className="label" htmlFor="friend-code">Connect with a friend</label>
      <div className="friend-code-input__controls">
        <input
          aria-describedby={error ? 'friend-code-error' : undefined}
          aria-invalid={Boolean(error)}
          className="input"
          id="friend-code"
          maxLength={7}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="Enter 7-char ID"
          value={value}
        />
        <Button disabled={disabled || value.length !== 7} type="submit" variant="secondary">Link</Button>
      </div>
      {error && <span className="error-text" id="friend-code-error">{error}</span>}
    </form>
  )
}
