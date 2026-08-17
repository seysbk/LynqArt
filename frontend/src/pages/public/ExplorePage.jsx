import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { ExhibitionCard } from '../../components/ui/ExhibitionCard'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Search, Filter } from 'lucide-react'

export function ExplorePage() {
  const [items, setItems] = useState([])
  const [exhibitions, setExhibitions] = useState([])
  const [status, setStatus] = useState('loading')
  const [query, setQuery] = useSearchParams()
  const search = query.get('search') || ''
  const filterType = query.get('type') || 'artworks'
  const filterStatus = query.get('status') || 'published'
  const sort = query.get('sort') || '-created_at'

  useEffect(() => {
    let alive = true

    if (filterType === 'exhibitions') {
      api
        .get('/exhibitions/', { params: { search, ordering: sort } })
        .then(({ data }) => {
          if (!alive) return
          setExhibitions((data.results || data || []).filter((e) => e.status === 'published'))
          setStatus('ready')
        })
        .catch(() => alive && setStatus('error'))
    } else {
      api
        .get('/artworks/', { params: search ? { search, ordering: sort } : { ordering: sort } })
        .then(({ data }) => {
          if (!alive) return
          setItems(data.results || data || [])
          setStatus('ready')
        })
        .catch(() => alive && setStatus('error'))
    }

    return () => {
      alive = false
    }
  }, [search, sort, filterType])

  const filteredItems = useMemo(() => {
    if (filterStatus === 'all') return items
    return items.filter((item) => item.status === filterStatus)
  }, [filterStatus, items])

  const onSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = {}
    if (form.get('search')) next.search = form.get('search')
    if (form.get('type')) next.type = form.get('type')
    if (form.get('status')) next.status = form.get('status')
    if (form.get('sort')) next.sort = form.get('sort')
    setQuery(next)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#F4F4F5]">Explore Digital Archives</h1>
        <p className="text-xs text-[#A1A1AA] mt-1">Browse published artworks, artist statements, and curated exhibition catalogues</p>
      </div>

      {/* Filter Form Bar */}
      <form
        onSubmit={onSubmit}
        className="surface-card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-center"
      >
        <div className="relative lg:col-span-2">
          <input
            className="w-full rounded-[9px] bg-[#0D0F14] border border-white/[0.09] pl-9 pr-3 py-2 text-xs text-[#F4F4F5] outline-none focus:border-indigo-400"
            name="search"
            defaultValue={search}
            placeholder="Search title, medium, category, year..."
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#71717A]" />
        </div>

        <select
          className="rounded-[9px] bg-[#0D0F14] border border-white/[0.09] px-3 py-2 text-xs text-[#F4F4F5] outline-none"
          name="type"
          defaultValue={filterType}
        >
          <option value="artworks">Artworks Archive</option>
          <option value="exhibitions">Exhibition Catalogues</option>
        </select>

        <select
          className="rounded-[9px] bg-[#0D0F14] border border-white/[0.09] px-3 py-2 text-xs text-[#F4F4F5] outline-none"
          name="sort"
          defaultValue={sort}
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="title">Title (A-Z)</option>
        </select>

        <Button type="submit" variant="primary" className="!py-2 text-xs">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
        </Button>
      </form>

      {status === 'loading' && <LoadingState title="Searching Archives" description="Loading entries..." />}
      {status === 'error' && <EmptyState title="Search Failed" description="Could not load entries." />}

      {status === 'ready' && (
        <>
          {filterType === 'exhibitions' ? (
            exhibitions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exhibitions.map((exhibition) => (
                  <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
                ))}
              </div>
            ) : (
              <EmptyState title="Nothing to see here yet." description="No published exhibitions match your filter." />
            )
          ) : filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <ArtworkCard key={item.id} artwork={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing to see here yet." description="No published artworks match your filter." />
          )}
        </>
      )}
    </div>
  )
}