import React from 'react'

export function LoadingState({ title = 'Loading...', description = 'Fetching data from archive...' }) {
  return (
    <div className="rounded-[14px] bg-[#141720] border border-white/[0.09] p-12 text-center my-6 space-y-3">
      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <h3 className="text-sm font-semibold text-[#F4F4F5]">{title}</h3>
      <p className="text-xs text-[#71717A]">{description}</p>
    </div>
  )
}
