import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { User, ShieldCheck } from 'lucide-react'
import { Logo } from './Logo'
import { PageContainer } from './PageContainer'
import { NotificationsCenter } from './NotificationsCenter'

export function Header({ session }) {
  const user = session?.user

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Exhibitions', path: '/explore?type=exhibitions' },
    { label: 'Artworks', path: '/explore' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' },
  ]

  const userProfilePath = user ? '/profile' : '/login'

  return (
    <header className="w-full bg-[#0D0F14]/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/[0.08]">
      {/* DESKTOP HEADER (>= 768px): Logo ─ Navigation ─ Profile */}
      <div className="hidden md:block">
        <PageContainer>
          <div className="h-[72px] flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Center: Desktop Navigation with thin vertical separators */}
            <nav className="flex items-center text-sm font-medium text-slate-400">
              {navItems.map((item, index) => (
                <React.Fragment key={item.path}>
                  {index > 0 && (
                    <span className="opacity-30 px-1 text-slate-500 font-light select-none">│</span>
                  )}
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `px-4 py-2 transition-colors duration-150 rounded-md ${
                        isActive
                          ? 'text-indigo-400 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </React.Fragment>
              ))}
            </nav>

            {/* Right: Notifications & Profile Icon */}
            <div className="flex items-center gap-3">
              <NotificationsCenter session={session} />
              <Link
                to={userProfilePath}
                className="h-10 w-10 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition-all"
                title={user ? `Profile: ${user.username}` : 'Sign In'}
                aria-label="User Profile"
              >
                {user?.is_artist ? (
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* MOBILE HEADER (< 768px): Header Row 1 (Logo ───── Profile) + Navigation Row 2 underneath */}
      <div className="block md:hidden">
        {/* Mobile Header Row 1 */}
        <div className="px-4 h-[62px] flex items-center justify-between border-b border-white/[0.04]">
          <Logo />

          <Link
            to={userProfilePath}
            className="h-9 w-9 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-slate-300 hover:text-white"
            title={user ? `Profile: ${user.username}` : 'Sign In'}
            aria-label="User Profile"
          >
            {user?.is_artist ? (
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>
        </div>

        {/* Mobile Navigation Row 2: Horizontal scrolling navigation row */}
        <div className="px-4 h-[46px] overflow-x-auto no-scrollbar flex items-center text-xs font-medium text-slate-400 whitespace-nowrap border-t border-white/[0.02]">
          <nav className="flex items-center min-w-max">
            {navItems.map((item, index) => (
              <React.Fragment key={item.path}>
                {index > 0 && (
                  <span className="opacity-30 px-1 text-slate-500 font-light select-none">│</span>
                )}
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 transition-colors duration-150 ${
                      isActive
                        ? 'text-indigo-400 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
