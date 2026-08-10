import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'

export function ArtworkDetailPage({ session }) {
  const { artworkId } = useParams()
  const [artwork, setArtwork] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    Promise.all([
      api.get(`/artworks/${artworkId}/`),
      api.get('/artworks/versions/', { params: { artwork_id: artworkId } }),
    ])
      .then(([artworkResponse, versionsResponse]) => {
        if (!alive) return
        setArtwork(artworkResponse.data)
        setVersions(versionsResponse.data.results || versionsResponse.data || [])
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [artworkId])

  if (loading) {
    return <CenteredState title="Loading artwork" description="Fetching the public detail page..." />
  }

  if (!artwork) {
    return <CenteredState title="Nothing to see here" description="This artwork does not exist yet, or it has not been published." />
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/25 backdrop-blur-sm sm:p-8">
        <PageHeader
          eyebrow="Artwork detail"
          title={artwork.title}
          subtitle={artwork.description || 'No description yet.'}
        />
        {artwork.markdown_statement ? (
          <div className="prose prose-invert max-w-none prose-headings:text-stone-50 prose-p:text-stone-300 prose-a:text-amber-200">
            <ReactMarkdown>{artwork.markdown_statement}</ReactMarkdown>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-stone-50 transition hover:bg-white/10" to="/explore">
            Back to explore
          </Link>
          {session.user ? (
            <Link className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90" to="/dashboard">
              Open dashboard
            </Link>
          ) : null}
        </div>
      </article>

      <aside className="space-y-4">
        <SectionCard title="Artwork meta" meta={artwork.status || 'Published artwork'}>
          <dl className="space-y-2 text-sm text-stone-300">
            <div className="flex items-center justify-between gap-4">
              <dt>Artist</dt>
              <dd>{artwork.artist_name || 'Available after profile connection'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Category</dt>
              <dd>{artwork.category_name || 'Uncategorized'}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Statement versions" meta={`${versions.length} versions captured`}>
          <div className="space-y-3">
            {versions.length ? (
              versions.map((version) => (
                <div key={version.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-stone-50">Version {version.version_number}</span>
                    <span className="text-xs text-stone-400">{version.created_at}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-300">Nothing to see here yet. No statement versions have been saved.</p>
            )}
          </div>
        </SectionCard>
      </aside>
    </section>
  )
}
