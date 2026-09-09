import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthForm } from '../../components/ui/AuthForm'
import { getApiErrorMessage } from '../../lib/errors'

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-indigo-500 placeholder:text-slate-500'

export function RegisterPage({ session }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  const handleGoogleAuth = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: async (response) => {
            if (response.credential) {
              await session.signInWithGoogle({ credential: response.credential })
              navigate('/dashboard')
            }
          },
        })
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            promptGoogleCredentialToken()
          }
        })
      } else {
        await promptGoogleCredentialToken()
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google registration failed.'))
      setGoogleLoading(false)
    }
  }

  const promptGoogleCredentialToken = async () => {
    const credential = window.prompt('Enter your Google ID token to authenticate with Google:')
    if (!credential) {
      setGoogleLoading(false)
      return
    }
    await session.signInWithGoogle({ credential })
    navigate('/dashboard')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setLoading(true)

    try {
      await session.register({
        email: form.get('email'),
        username: form.get('username'),
        password: form.get('password'),
        password_confirm: form.get('password_confirm'),
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
      })
      navigate('/dashboard')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Please review your registration details and try again.'))
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title="Create LynqArt Account"
      subtitle="Register a free account to participate in discussions, bookmark artworks, and activate your artist profile."
      onSubmit={onSubmit}
      error={error}
      loading={loading}
      onGoogleAuth={handleGoogleAuth}
      googleLoading={googleLoading}
      cta="Create Account"
    >
      <input className={inputClass} name="username" placeholder="Username *" required />
      <input className={inputClass} name="email" type="email" placeholder="Email address *" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} name="first_name" placeholder="First name" />
        <input className={inputClass} name="last_name" placeholder="Last name" />
      </div>
      <div className="relative">
        <input className={`${inputClass} pr-12`} name="password" type={showPassword ? 'text' : 'password'} placeholder="Password *" required />
        <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="relative">
        <input className={`${inputClass} pr-12`} name="password_confirm" type={showPasswordConfirmation ? 'text' : 'password'} placeholder="Confirm password *" required />
        <button type="button" onClick={() => setShowPasswordConfirmation((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}>
          {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center pt-2">
        Already registered?{' '}
        <Link className="text-indigo-400 font-semibold hover:underline" to="/login">
          Sign In
        </Link>
      </p>
    </AuthForm>
  )
}
