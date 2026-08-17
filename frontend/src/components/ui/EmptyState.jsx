import React from 'react'

export function EmptyState({ title = 'Nothing to see here yet.', description = 'Content will appear here once published.', action }) {
  return (
    <div className="rounded-[14px] bg-[#141720] border border-white/[0.09] p-8 text-center my-4 space-y-2">
      <h3 className="text-base font-semibold text-[#F4F4F5]">{title}</h3>
      <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && <div className="pt-3">{action}</div>}
    </div>
  )
}
