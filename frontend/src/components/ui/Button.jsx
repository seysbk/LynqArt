import React from 'react'

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyle =
    'inline-flex min-w-0 whitespace-nowrap items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[#635fc7] text-white hover:bg-[#7c3aed] border border-transparent rounded-[9px] px-3 sm:px-4 py-1.5 sm:py-2 font-semibold shadow-sm',
    secondary:
      'bg-transparent text-[#F4F4F5] hover:bg-white/[0.04] border border-white/[0.09] hover:border-white/[0.14] rounded-[9px] px-3 sm:px-4 py-1.5 sm:py-2',
    outline:
      'bg-transparent text-[#A1A1AA] hover:text-[#F4F4F5] border border-white/[0.09] hover:border-white/[0.14] rounded-[9px] px-3 py-1.5 text-xs',
  }

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
