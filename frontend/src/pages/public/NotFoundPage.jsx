import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Compass, Home, Search, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 space-y-6 max-w-lg mx-auto">
      <div className="h-20 w-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        <Compass className="h-10 w-10 animate-spin-slow" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">404 Error</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F4F5]">Artwork or Page Not Found</h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
          The artwork statement, exhibition catalogue, or URL you are trying to reach does not exist or may have been moved.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link to="/">
          <Button variant="primary" className="!py-2 text-xs">
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Button>
        </Link>
        <Link to="/explore">
          <Button variant="secondary" className="!py-2 text-xs">
            <Search className="h-4 w-4" />
            <span>Explore Artworks</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
