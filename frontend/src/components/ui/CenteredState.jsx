export function CenteredState({ title, description }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/6 px-6 py-14 text-center shadow-2xl shadow-black/30 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-stone-50">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-stone-300">{description}</p>
    </section>
  )
}
