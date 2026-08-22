import React from 'react'
import { Link } from 'react-router-dom'

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center group ${className}`} aria-label="LynqArt home">
      <span className="text-[2.2rem] font-normal leading-none text-slate-100 font-display-logo tracking-tighter select-none flex items-center">
        <span>L</span>
        <span>y</span>
        <span>n</span>
        <span>q</span>
        <span className="inline-block text-indigo-400 font-semibold" style={{ transform: 'rotate(350deg)' }}>A</span>
        <span className="inline-block" style={{ transform: 'rotate(350deg) translateY(-2px) translateX(-1px)' }}>r</span>
        <span>t</span>
      </span>
    </Link>
  )
}
