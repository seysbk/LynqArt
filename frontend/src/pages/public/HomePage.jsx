import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(232,121,249,0.14),_transparent_26%),rgba(255,255,255,0.06)] p-8 shadow-2xl shadow-black/25 backdrop-blur-sm sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">Exhibition-first art publishing</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-stone-50 sm:text-6xl">
        Show the work, the statement, and the path to each exhibit in one public page.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-300">
        LynqArt connects artworks, artist profiles, exhibitions, QR landing pages, and analytics through one browser-based shell.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90" to="/explore">
          Explore artworks
        </Link>
        <Link className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-stone-50 transition hover:bg-white/10" to="/register">
          Create account
        </Link>
      </div>
    </section>
  )
}
