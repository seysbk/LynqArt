import React from 'react'
import { Loader2 } from 'lucide-react'
import { Icon } from './Icons'

export function GoogleAuthButton({ onClick, loading, label = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.22 0 10.06 0 12s.47 3.78 1.29 5.42l3.99-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}

export function AuthForm({ title, subtitle, children, onSubmit, error, cta, loading = false, onGoogleAuth, googleLoading = false }) {
  return (
    <section className="mx-auto max-w-lg fm-card p-8 shadow-2xl shadow-indigo-950/40 my-8">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
          <Icon name="user" className="h-6 w-6" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Account Security</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-xs text-slate-400 leading-relaxed">{subtitle}</p>}
      </div>

      {onGoogleAuth && (
        <div className="mb-5 space-y-4">
          <GoogleAuthButton onClick={onGoogleAuth} loading={googleLoading || loading} />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#0e1118] px-2 text-slate-500 font-medium">Or continue with credentials</span>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <fieldset disabled={loading || googleLoading} className="space-y-4 border-0 p-0 m-0">
          {children}
        </fieldset>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-center gap-2">
            <Icon name="help" className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="fm-btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin text-white" /><span>Authenticating...</span></>
          ) : (
            <><span>{cta}</span><Icon name="arrowRight" className="h-4 w-4" /></>
          )}
        </button>
      </form>
    </section>
  )
}

