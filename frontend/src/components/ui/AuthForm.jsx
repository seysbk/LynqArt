export function AuthForm({ title, subtitle, children, onSubmit, error, cta }) {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25 backdrop-blur-sm sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">Account access</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-50">{title}</h1>
        {subtitle ? <p className="mt-3 text-stone-300">{subtitle}</p> : null}
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        {children}
        {error ? <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
        <button
          type="submit"
          className="inline-flex rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90"
        >
          {cta}
        </button>
      </form>
    </section>
  )
}
