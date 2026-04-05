import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { signIn } from '../lib/auth'

type AuthMode = 'login' | 'signup'

type AuthPageCopy = {
  heading: string
  actionLabel: string
  switchPrompt: string
  switchLabel: string
  switchTo: '/login' | '/signup'
}

const pageCopy: Record<AuthMode, AuthPageCopy> = {
  login: {
    heading: 'Welcome Back',
    actionLabel: 'Sign In',
    switchPrompt: "Don't have an account?",
    switchLabel: 'Create account',
    switchTo: '/signup',
  },
  signup: {
    heading: 'Create Account',
    actionLabel: 'Sign Up',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/login',
  },
}

function AuthPage({ mode }: { mode: AuthMode }) {
  const copy = useMemo(() => pageCopy[mode], [mode])
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isSignup && !name.trim()) {
      setError('Please enter your display name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password.trim() || password.length < 4) {
      setError('Password should be at least 4 characters.')
      return
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    signIn(email.trim())
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[rgba(124,58,237,0.25)] blur-3xl" />
        <div className="absolute -right-16 top-6 h-80 w-80 rounded-full bg-[rgba(59,130,246,0.2)] blur-3xl" />
        <div className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(124,58,237,0.12)] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[27rem]">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--purple)] via-[var(--glow)] to-[var(--blue)] shadow-[0_18px_40px_rgba(124,58,237,0.35)]">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
            MusicFlow
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Promote your music and earn rewards
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="surface-glow rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8"
        >
          <h2 className="text-center font-display text-3xl font-semibold text-[var(--text-primary)]">
            {copy.heading}
          </h2>

          <p className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
            Dummy auth enabled for now. Any valid email + password works.
          </p>

          <div className="mt-6 space-y-4">
            {isSignup && (
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Password
              </span>
              <input
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
              />
            </label>

            {isSignup && (
              <label className="block">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Confirm password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
                />
              </label>
            )}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] text-base font-semibold text-white shadow-[0_18px_30px_rgba(124,58,237,0.28)] transition hover:brightness-110"
          >
            {copy.actionLabel}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
          {copy.switchPrompt}{' '}
          <Link
            to={copy.switchTo}
            className="font-semibold text-[var(--glow)] transition hover:text-[var(--blue)]"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}

export function LoginPage() {
  return <AuthPage mode="login" />
}

export function SignupPage() {
  return <AuthPage mode="signup" />
}
