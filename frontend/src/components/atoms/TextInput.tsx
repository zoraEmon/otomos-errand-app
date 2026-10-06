import type { InputHTMLAttributes } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
}

export function TextInput({
  error,
  helperText,
  id,
  label,
  ...props
}: TextInputProps) {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <div className="field">
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="input"
        id={id}
        {...props}
      />
      {error && <span className="error-text" id={`${id}-error`}>{error}</span>}
      {!error && helperText && <span className="helper-text" id={`${id}-helper`}>{helperText}</span>}
    </div>
  )
}
