import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthForm } from '../../components/ui/AuthForm'

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
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
      })
      navigate('/dashboard')
    } catch {
      setError('Registration failed. Please review the fields and try again.')
    }
  }

  return (
    <AuthForm
      title="Register"
      subtitle="Create a free account to publish artworks and manage your exhibition tools."
      onSubmit={onSubmit}
      error={error}
      cta="Create account"
    >
      <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50" name="username" placeholder="Username" required />
      <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50" name="email" type="email" placeholder="Email" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50" name="first_name" placeholder="First name" />
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50" name="last_name" placeholder="Last name" />
      </div>
      <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50" name="password" type="password" placeholder="Password" required />
      <p className="text-sm text-stone-300">
        Already have an account? <Link className="text-amber-200 hover:text-amber-100" to="/login">Login</Link>
      </p>
    </AuthForm>
  )
}
