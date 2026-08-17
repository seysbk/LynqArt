import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthForm } from '../../components/ui/AuthForm'
import { getApiErrorMessage } from '../../lib/errors'

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-indigo-500 placeholder:text-slate-500'

export function RegisterPage({ session }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')

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
    }
  }

  return (
    <AuthForm
      title="Create LynqArt Account"
      subtitle="Register a free account to participate in discussions, bookmark artworks, and activate your artist profile."
      onSubmit={onSubmit}
      error={error}
      cta="Create Account"
    >
      <input className={inputClass} name="username" placeholder="Username *" required />
      <input className={inputClass} name="email" type="email" placeholder="Email address *" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} name="first_name" placeholder="First name" />
        <input className={inputClass} name="last_name" placeholder="Last name" />
      </div>
      <input className={inputClass} name="password" type="password" placeholder="Password *" required />
      <input className={inputClass} name="password_confirm" type="password" placeholder="Confirm password *" required />
      <p className="text-xs text-slate-400 text-center pt-2">
        Already registered?{' '}
        <Link className="text-indigo-400 font-semibold hover:underline" to="/login">
          Sign In
        </Link>
      </p>
    </AuthForm>
  )
}
