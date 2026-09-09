import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, MessageSquare, Pencil, Upload, User, UserRound } from 'lucide-react'
import { Logo } from './Logo'
import { PageContainer } from './PageContainer'
import { NotificationsCenter } from './NotificationsCenter'
import { mediaUrl } from '../../lib/media'
import { FeedbackModal } from './FeedbackModal'

function AccountMenu({ session }) {
  const user = session?.user
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const closeMenu = () => setOpen(false)
  const openFeedback = () => {
    closeMenu()
    setFeedbackOpen(true)
  }
  const signOut = () => {
    session?.signOut?.()
    closeMenu()
    navigate('/')
  }

  const avatarRaw = user?.artist_profile?.avatar_url || user?.avatar_url
  const avatarUrl = avatarRaw ? mediaUrl(avatarRaw) : ''
  const userInitials = (user?.full_name || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const renderBadge = () => {
    if (!user) return <User className="h-5 w-5" />
    if (avatarUrl) return <img src={avatarUrl} alt={user.full_name || user.username} className="h-full w-full rounded-full object-cover" />
    return <span className="text-xs font-semibold text-indigo-400">{userInitials}</span>
  }

  const linkClass = 'flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.05] hover:text-white'

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="h-10 w-10 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all overflow-hidden"
        title={user ? `Account menu: ${user.username}` : 'Account menu'}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {renderBadge()}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#141720] py-1 shadow-2xl" role="menu">
          {user?.is_artist && (
            <Link to={`/artists/${user.username}`} onClick={closeMenu} className={linkClass} role="menuitem">
              <UserRound className="h-4 w-4 text-indigo-400" />
              <span>View public profile</span>
            </Link>
          )}
          {user && (
            <Link to="/profile" onClick={closeMenu} className={linkClass} role="menuitem">
              <Pencil className="h-4 w-4 text-slate-400" />
              <span>Edit profile</span>
            </Link>
          )}
          <button type="button" onClick={openFeedback} className={`${linkClass} w-full`} role="menuitem">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span>Give feedback</span>
          </button>
          <Link to={user?.is_artist ? '/dashboard/artworks/new' : user ? '/profile' : '/login?next=%2Fprofile'} onClick={closeMenu} className={linkClass} role="menuitem">
            <Upload className="h-4 w-4 text-slate-400" />
            <span>{user?.is_artist ? 'Upload artwork' : user ? 'Become an artist' : 'Upload artwork'}</span>
          </Link>
          <div className="my-1 border-t border-white/[0.07]" />
          {user ? (
            <button type="button" onClick={signOut} className={`${linkClass} w-full text-rose-300 hover:text-rose-200`} role="menuitem">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          ) : (
            <Link to="/login" onClick={closeMenu} className={linkClass} role="menuitem">
              <LogIn className="h-4 w-4 text-indigo-400" />
              <span>Log in</span>
            </Link>
          )}
        </div>
      )}

      {feedbackOpen && <FeedbackModal session={session} onClose={() => setFeedbackOpen(false)} />}
    </div>
  )
}

export function Header({ session }) {
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Exhibitions', path: '/explore?type=exhibitions' },
    { label: 'Artworks', path: '/explore' },
    { label: 'Dashboard', path: '/dashboard' },
  ]

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
                      `px-4 py-2 transition-colors duration-150 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
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
              <AccountMenu session={session} />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* MOBILE HEADER (< 768px): Header Row 1 (Logo ───── Profile) + Navigation Row 2 underneath */}
      <div className="block md:hidden">
        {/* Mobile Header Row 1 */}
        <div className="px-4 h-[62px] flex items-center justify-between border-b border-white/[0.04]">
          <Logo />

          <div className="flex items-center gap-2">
            <NotificationsCenter session={session} />
            <AccountMenu session={session} />
          </div>
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
