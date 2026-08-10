export function SectionCard({ title, meta, children, href }) {
  const content = (
    <article className="h-full rounded-3xl border border-white/10 bg-white/6 p-5 shadow-xl shadow-black/20 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-stone-50">{title}</h3>
      {meta ? <p className="mt-2 text-sm text-stone-300">{meta}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  )

  return href ? (
    <a href={href} className="block h-full transition hover:-translate-y-0.5 hover:opacity-95">
      {content}
    </a>
  ) : (
    content
  )
}
