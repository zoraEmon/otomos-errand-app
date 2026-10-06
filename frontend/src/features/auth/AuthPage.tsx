import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { LoginSchema, SignupSchema, type LoginInput, type SignupInput } from '../../../../shared/contracts/auth.contract'
import { AuthCard } from '../../components/organisms'
import { PasswordInput, TextInput } from '../../components/atoms'
import { ApiError, login, signup } from '../../lib/apiClient'

type AuthMode = 'login' | 'signup'

type AuthPageProps = {
  onAuthenticated?: (username: string) => void
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [serverError, setServerError] = useState<string>()
  const isSignup = mode === 'signup'
  const schema = isSignup ? SignupSchema : LoginSchema

  const form = useForm({
    defaultValues: {
      password: '',
      username: '',
    },
    onSubmit: async ({ value }) => {
      setServerError(undefined)
      const response = isSignup
        ? await signup(value as SignupInput)
        : await login(value as LoginInput)
      onAuthenticated?.(response.user.username)
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = schema.safeParse(value)
        return result.success ? undefined : result.error.issues[0]?.message
      },
    },
  })

  const handleSubmit = async () => {
    try {
      await form.handleSubmit()
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
        return
      }
      setServerError('Unable to connect to Otomos. Please try again.')
    }
  }

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup')
    setServerError(undefined)
    form.reset()
  }

  const validateUsername = (value: string) => {
    const result = schema.shape.username.safeParse(value)
    return result.success ? undefined : result.error.issues[0]?.message ?? 'Invalid username'
  }

  const validatePassword = (value: string) => {
    const result = schema.shape.password.safeParse(value)
    return result.success ? undefined : result.error.issues[0]?.message ?? 'Invalid password'
  }

  return (
    <main className="auth-page">
      <AuthCard
        footer={
          <button className="auth-page__switch" onClick={switchMode} type="button">
            {isSignup ? 'Already have an account? Sign in' : 'New to Otomos? Create an account'}
          </button>
        }
        logo={<span aria-hidden="true">◉</span>}
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
        submitLabel={isSignup ? 'Create account' : 'Sign in'}
        subtitle="Frictionless errand running"
        title="OTOMOS"
      >
        <form.Field name="username" validators={{ onChange: ({ value }) => validateUsername(value) }}>
          {(field) => (
            <TextInput
              autoComplete="username"
              error={field.state.meta.isTouched ? String(field.state.meta.errors[0] ?? '') || undefined : undefined}
              id="username"
              label="Username"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="e.g. Alex"
              value={field.state.value}
            />
          )}
        </form.Field>
        <form.Field name="password" validators={{ onChange: ({ value }) => validatePassword(value) }}>
          {(field) => (
            <PasswordInput
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              error={field.state.meta.isTouched ? String(field.state.meta.errors[0] ?? '') || undefined : undefined}
              id="password"
              label="Password"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
              value={field.state.value}
            />
          )}
        </form.Field>
        {serverError && <p className="auth-page__error" role="alert">{serverError}</p>}
        {isSignup && <p className="helper-text">Use 8+ characters with uppercase, lowercase, and a number.</p>}
      </AuthCard>
    </main>
  )
}
