import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthForm } from '../../components/ui/AuthForm'

export function LoginPage({ session }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError('')

    try {
      await session.signIn({
        email: form.get('email'),
        password: form.get('password'),
      })
      navigate('/dashboard')
    } catch {
      setError('Login failed. Check your email and password.')
    }
  }

  return (
    <AuthForm
      title="Login"
      subtitle="Use your JWT-backed account to access the dashboard."
      onSubmit={onSubmit}
      error={error}
      cta="Login"
    >
      <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none ring-0 placeholder:text-stone-400 focus:border-amber-200/50" name="email" type="email" placeholder="Email" required />
      <input className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none ring-0 placeholder:text-stone-400 focus:border-amber-200/50" name="password" type="password" placeholder="Password" required />
      <p className="text-sm text-stone-300">
        New here? <Link className="text-amber-200 hover:text-amber-100" to="/register">Create an account</Link>
      </p>
    </AuthForm>
  )
}
