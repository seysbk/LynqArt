import { Link } from 'react-router-dom'

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center group ${className}`} aria-label="LynqArt home">
      <span className="font-display-logo flex select-none items-center text-[2.2rem] font-normal leading-none tracking-tighter text-slate-100">
        <span>L</span><span>y</span><span>n</span><span>q</span>
        <span className="logo-letter logo-letter-a text-indigo-400">A</span>
        <span className="logo-letter logo-letter-r">r</span><span>t</span>
      </span>
    </Link>
  )
}
