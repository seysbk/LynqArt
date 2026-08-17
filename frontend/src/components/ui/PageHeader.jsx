import React from 'react'

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
      <div className="space-y-2">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
