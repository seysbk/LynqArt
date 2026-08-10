import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'

export function ArtistProfilePage() {
  const { artistId } = useParams()
  const [profile, setProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    Promise.all([
      api.get('/accounts/artist-profiles/', { params: { user: artistId } }),
      api.get('/artworks/', { params: { artist_id: artistId, status: 'published', ordering: '-created_at' } }),
    ])
      .then(([profileRes, artworksRes]) => {
        if (!alive) return
        const records = profileRes.data.results || profileRes.data || []
        setProfile(records[0] || null)
        setArtworks(artworksRes.data.results || artworksRes.data || [])
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [artistId])

  if (loading) {
    return <CenteredState title="Loading artist profile" description="Fetching public profile data..." />
  }

  if (!profile) {
    return <CenteredState title="Nothing to see here" description="This artist profile does not have public data yet." />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Public artist profile"
        title={profile.user?.full_name || profile.user?.username || 'Artist'}
        subtitle={profile.bio || 'No bio provided yet.'}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <SectionCard title="About" meta={profile.location || 'No location listed'}>
          <dl className="space-y-3 text-sm text-stone-300">
            <div className="flex items-center justify-between gap-4">
              <dt>Website</dt>
              <dd>{profile.website ? <a className="text-amber-200 hover:text-amber-100" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : 'Not provided'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Instagram</dt>
              <dd>{profile.instagram || 'Not provided'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Twitter</dt>
              <dd>{profile.twitter || 'Not provided'}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Published artworks" meta={`${artworks.length} public works`}>
          <div className="space-y-3">
            {artworks.length ? artworks.map((artwork) => (
              <div key={artwork.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-stone-50">{artwork.title}</p>
                    <p className="text-sm text-stone-300">{artwork.category_detail?.name || artwork.medium || 'Artwork'}</p>
                  </div>
                  <Link className="text-sm text-amber-200 hover:text-amber-100" to={`/artworks/${artwork.id}`}>
                    Open
                  </Link>
                </div>
              </div>
            )) : <p className="text-sm text-stone-300">Nothing to see here yet. No public artworks found.</p>}
          </div>
        </SectionCard>
      </div>
    </section>
  )
}
