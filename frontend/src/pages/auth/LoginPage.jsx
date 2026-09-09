import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthForm } from '../../components/ui/AuthForm'
import { getApiErrorMessage } from '../../lib/errors'

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-indigo-500 placeholder:text-slate-500'

export function LoginPage({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
              const nextPath = new URLSearchParams(location.search).get('next')
              navigate(nextPath?.startsWith('/') ? nextPath : '/dashboard')
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
      setError(getApiErrorMessage(err, 'Google authentication failed.'))
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
    const nextPath = new URLSearchParams(location.search).get('next')
    navigate(nextPath?.startsWith('/') ? nextPath : '/dashboard')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')
    setLoading(true)

    try {
      await session.signIn({
        username: form.get('identifier'),
        password: form.get('password'),
      })
      const nextPath = new URLSearchParams(location.search).get('next')
      navigate(nextPath?.startsWith('/') ? nextPath : '/dashboard')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Please check your credentials and try again.'))
      setLoading(false)
    }
  }

  return (
    <AuthForm
      title="Sign In to LynqArt"
      subtitle="Access your creator dashboard, statement history, and physical QR codes."
      onSubmit={onSubmit}
      error={error}
      loading={loading}
      onGoogleAuth={handleGoogleAuth}
      googleLoading={googleLoading}
      cta="Sign In"
    >
      <input
        className={inputClass}
        name="identifier"
        placeholder="Username or Email address"
        required
      />
      <div className="relative">
        <input
          className={`${inputClass} pr-12`}
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center pt-2">
        Don't have an account yet?{' '}
        <Link className="text-indigo-400 font-semibold hover:underline" to="/register">
          Create free account
        </Link>
      </p>
    </AuthForm>
  )
}
