import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'

export function ExhibitionPage() {
  const { exhibitionId } = useParams()
  const [exhibition, setExhibition] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .get(`/exhibitions/${exhibitionId}/`)
      .then(({ data }) => {
        if (!alive) return
        setExhibition(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [exhibitionId])

  if (loading) {
    return <CenteredState title="Loading exhibition" description="Fetching the public catalogue..." />
  }

  if (!exhibition) {
    return <CenteredState title="Nothing to see here" description="This exhibition does not have public data yet." />
  }

  const artworks = exhibition.artworks || []

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Public exhibition catalogue"
        title={exhibition.title}
        subtitle={exhibition.short_description || exhibition.markdown_description || 'No description yet.'}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <SectionCard title="Catalogue details" meta={exhibition.location || 'Location not listed'}>
          <dl className="space-y-3 text-sm text-stone-300">
            <div className="flex items-center justify-between gap-4">
              <dt>Status</dt>
              <dd>{exhibition.status || 'draft'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Start</dt>
              <dd>{exhibition.start_date || 'Not set'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>End</dt>
              <dd>{exhibition.end_date || 'Not set'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Featured</dt>
              <dd>{exhibition.is_featured ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Linked artworks" meta={`${artworks.length} artworks`}>
          <div className="space-y-3">
            {artworks.length ? artworks.map((item) => {
              const artwork = item.artwork_detail || {}
              return (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-50">{artwork.title || 'Untitled artwork'}</p>
                      <p className="text-sm text-stone-300">{artwork.medium || artwork.category_detail?.name || 'Artwork'}</p>
                    </div>
                    {artwork.id ? (
                      <Link className="text-sm text-amber-200 hover:text-amber-100" to={`/artworks/${artwork.id}`}>
                        Open
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            }) : <p className="text-sm text-stone-300">Nothing to see here yet. No artworks are linked to this exhibition.</p>}
          </div>
        </SectionCard>
      </div>
    </section>
  )
}
