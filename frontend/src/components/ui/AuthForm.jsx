import React from 'react'
import { Icon } from './Icons'

export function AuthForm({ title, subtitle, children, onSubmit, error, cta }) {
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

      <form className="space-y-4" onSubmit={onSubmit}>
        {children}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 flex items-center gap-2">
            <Icon name="help" className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="fm-btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
        >
          <span>{cta}</span>
          <Icon name="arrowRight" className="h-4 w-4" />
        </button>
      </form>
    </section>
  )
}
