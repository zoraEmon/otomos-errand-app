import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { IconButton } from './IconButton'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  helperText?: string
}

export function PasswordInput({
  error,
  helperText,
  id,
  label = 'Password',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="input password-input__control"
          id={id}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <IconButton
          className="password-input__toggle"
          icon={<span aria-hidden="true">{visible ? 'Hide' : 'Show'}</span>}
          label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        />
      </div>
      {error && <span className="error-text" id={`${id}-error`}>{error}</span>}
      {!error && helperText && <span className="helper-text" id={`${id}-helper`}>{helperText}</span>}
    </div>
  )
}
