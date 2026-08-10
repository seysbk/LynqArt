export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-8">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">{eyebrow}</p> : null}
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">{title}</h1>
      {subtitle ? <p className="mt-4 max-w-3xl text-base leading-7 text-stone-300">{subtitle}</p> : null}
    </div>
  )
}
