import { Link, Outlet } from 'react-router-dom'

export function AppLayout({ session }) {
  return (
    <div className="min-h-screen text-stone-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="text-sm font-bold uppercase tracking-[0.28em] text-stone-50">
          LynqArt
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10" to="/explore">
            Explore
          </Link>
          <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10" to="/dashboard">
            Dashboard
          </Link>
          {session.user ? (
            <button
              type="button"
              onClick={session.signOut}
              className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-4 py-2 font-semibold text-slate-950 transition hover:opacity-90"
            >
              Logout
            </button>
          ) : (
            <Link className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-4 py-2 font-semibold text-slate-950 transition hover:opacity-90" to="/login">
              Login
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-sm text-stone-300/70 sm:px-6 lg:px-8">
        Permanent artwork pages, exhibition catalogues, and QR-ready public links.
      </footer>
    </div>
  )
}
