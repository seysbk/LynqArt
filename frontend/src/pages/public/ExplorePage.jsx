import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'

export function ExplorePage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [query, setQuery] = useSearchParams()
  const search = query.get('search') || ''

  useEffect(() => {
    let alive = true

    api
      .get('/artworks/', { params: search ? { search } : undefined })
      .then(({ data }) => {
        if (!alive) return
        setItems(data.results || data || [])
        setStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [search])

  const onSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setQuery(form.get('search') ? { search: form.get('search') } : {})
  }

  return (
    <section>
      <PageHeader
        eyebrow="Public browsing"
        title="Explore artworks"
        subtitle="Browse published pieces, categories, and statements."
      />

      <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 outline-none placeholder:text-stone-400 focus:border-amber-200/50"
          name="search"
          defaultValue={search}
          placeholder="Search title, category, tag, year"
        />
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {status === 'loading' ? <CenteredState title="Loading" description="Fetching artworks..." /> : null}
      {status === 'error' ? <CenteredState title="Error" description="Could not load artworks." /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {status === 'ready' && items.length === 0 ? (
          <CenteredState title="Nothing to see here" description="There are no artworks in the database yet. Try again after content is published." />
        ) : null}

        {items.map((item) => (
          <SectionCard
            key={item.id}
            title={item.title}
            meta={item.status || item.category_name || 'Artwork'}
            href={`/artworks/${item.id}`}
          />
        ))}
      </div>

      <div className="mt-8 text-sm text-stone-300">
        Looking for more discovery tools? Try the{' '}
        <Link className="text-amber-200 hover:text-amber-100" to="/dashboard">
          dashboard
        </Link>
        .
      </div>
    </section>
  )
}
