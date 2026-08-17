import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthForm } from '../../components/ui/AuthForm'
import { getApiErrorMessage } from '../../lib/errors'

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-indigo-500 placeholder:text-slate-500'

export function LoginPage({ session }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')

    try {
      await session.signIn({
        username: form.get('identifier'),
        password: form.get('password'),
      })
      navigate('/dashboard')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Please check your credentials and try again.'))
    }
  }

  return (
    <AuthForm
      title="Sign In to LynqArt"
      subtitle="Access your creator dashboard, statement history, and physical QR codes."
      onSubmit={onSubmit}
      error={error}
      cta="Sign In"
    >
      <input
        className={inputClass}
        name="identifier"
        placeholder="Username or Email address"
        required
      />
      <input
        className={inputClass}
        name="password"
        type="password"
        placeholder="Password"
        required
      />
      <p className="text-xs text-slate-400 text-center pt-2">
        Don't have an account yet?{' '}
        <Link className="text-indigo-400 font-semibold hover:underline" to="/register">
          Create free account
        </Link>
      </p>
    </AuthForm>
  )
}
