import React from 'react'
import { Icon } from './Icons'

export function CenteredState({ title, description, icon = 'sparkles', action }) {
  return (
    <section className="fm-card flex flex-col items-center justify-center px-6 py-16 text-center my-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
        <Icon name={icon} className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400 leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  )
}
