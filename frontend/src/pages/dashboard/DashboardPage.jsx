import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'

export function DashboardPage({ session }) {
  const user = session.user ?? {}
  const [profile, setProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [exhibitions, setExhibitions] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [comments, setComments] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const capabilityItems = useMemo(
    () => [
      ['Artist', user.is_artist ? 'Enabled' : 'Not enabled'],
      ['Expert', user.is_expert ? 'Enabled' : 'Not enabled'],
      ['Exhibitions', user.can_manage_exhibitions ? 'Enabled' : 'Not enabled'],
    ],
    [user.is_artist, user.is_expert, user.can_manage_exhibitions],
  )

  useEffect(() => {
    let alive = true

    Promise.all([
      api.get('/accounts/profile/'),
      api.get('/accounts/artist-profile/').catch(() => ({ data: null })),
      api.get('/artworks/', { params: { ordering: '-created_at' } }),
      api.get('/exhibitions/', { params: { ordering: '-created_at' } }),
      api.get('/qr/codes/', { params: { ordering: '-created_at' } }),
      api.get('/comments/', { params: { user: user.id, ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/comments/favorites/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
    ])
      .then(([profileRes, artistRes, artworksRes, exhibitionsRes, qrRes, commentsRes, favoritesRes]) => {
        if (!alive) return
        setProfile(profileRes.data)
        setArtistProfile(artistRes.data)
        const allArtworks = artworksRes.data.results || artworksRes.data || []
        const allExhibitions = exhibitionsRes.data.results || exhibitionsRes.data || []
        const allQrCodes = qrRes.data.results || qrRes.data || []
        setArtworks(allArtworks.filter((item) => item.artist?.id === user.id))
        setExhibitions(allExhibitions.filter((item) => item.organizer?.id === user.id))
        setQrCodes(
          allQrCodes.filter(
            (item) =>
              (item.entity_type === 'artwork' && artworksRes.data && allArtworks.some((artwork) => artwork.id === item.entity_id)) ||
              (item.entity_type === 'exhibition' && allExhibitions.some((exhibition) => exhibition.id === item.entity_id)),
          ),
        )
        setComments(commentsRes.data.results || commentsRes.data || [])
        setFavorites(favoritesRes.data.results || favoritesRes.data || [])
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setError('Could not load dashboard data right now.')
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [user.id])

  const handleBecomeArtist = async () => {
    setStatusMessage('')
    try {
      const { data } = await api.post('/accounts/become-artist/', {})
      setProfile(data.user)
      setArtistProfile(data.artist_profile)
      setStatusMessage('Artist access enabled.')
    } catch {
      setStatusMessage('Unable to enable artist access.')
    }
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatusMessage('')
    try {
      const { data } = await api.patch('/accounts/profile/', {
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
      })
      setProfile(data)
      setStatusMessage('Profile saved.')
    } catch {
      setStatusMessage('Profile update failed.')
    }
  }

  const handleArtistSave = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatusMessage('')
    try {
      const { data } = await api.patch('/accounts/artist-profile/', {
        bio: form.get('bio'),
        website: form.get('website'),
        instagram: form.get('instagram'),
        twitter: form.get('twitter'),
        phone: form.get('phone'),
        location: form.get('location'),
      })
      setArtistProfile(data)
      setStatusMessage('Artist profile saved.')
    } catch {
      setStatusMessage('Artist profile update failed.')
    }
  }

  const handleGenerateQr = async (entityType, entityId) => {
    try {
      const { data } = await api.post('/qr/codes/generate_qr/', { entity_type: entityType, entity_id: entityId })
      setQrCodes((current) => [data, ...current.filter((item) => item.entity_type !== entityType || item.entity_id !== entityId)])
      setStatusMessage('QR code generated.')
    } catch {
      setStatusMessage('QR generation failed.')
    }
  }

  if (loading) {
    return <CenteredState title="Loading dashboard" description="Fetching your artworks, exhibitions, QR codes, and profile data..." />
  }

  if (error) {
    return <CenteredState title="Dashboard unavailable" description={error} />
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Authenticated workspace"
        title="Dashboard"
        subtitle="A working space for artist tools, QR workflows, analytics, and profile management."
      />

      {statusMessage ? (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-50">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {capabilityItems.map(([label, value]) => (
          <SectionCard key={label} title={label} meta={value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Profile" meta={profile?.email || user.email || 'Current account'}>
          <form className="space-y-3" onSubmit={handleProfileSave}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input defaultValue={profile?.first_name || ''} name="first_name" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="First name" />
              <input defaultValue={profile?.last_name || ''} name="last_name" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Last name" />
            </div>
            <button className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950">
              Save profile
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Artist access" meta={profile?.is_artist ? 'Artist enabled' : 'Not an artist yet'}>
          {profile?.is_artist ? (
            <form className="space-y-3" onSubmit={handleArtistSave}>
              <textarea defaultValue={artistProfile?.bio || ''} name="bio" rows="4" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Artist bio" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input defaultValue={artistProfile?.website || ''} name="website" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Website" />
                <input defaultValue={artistProfile?.instagram || ''} name="instagram" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Instagram" />
                <input defaultValue={artistProfile?.twitter || ''} name="twitter" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Twitter" />
                <input defaultValue={artistProfile?.phone || ''} name="phone" className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Phone" />
              </div>
              <input defaultValue={artistProfile?.location || ''} name="location" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-stone-50 placeholder:text-stone-400" placeholder="Location" />
              <button className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950">
                Save artist profile
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleBecomeArtist}
              className="rounded-full bg-gradient-to-r from-amber-200 to-fuchsia-300 px-5 py-3 font-semibold text-slate-950"
            >
              Become an artist
            </button>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Your artworks"
          meta={`${artworks.length} items`}
          href="/explore"
        >
          <div className="space-y-3">
            {artworks.length ? artworks.slice(0, 5).map((artwork) => (
              <div key={artwork.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-stone-50">{artwork.title}</p>
                    <p className="text-sm text-stone-300">{artwork.status || 'draft'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link className="text-sm text-amber-200 hover:text-amber-100" to={`/artworks/${artwork.id}`}>
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-sm text-amber-200 hover:text-amber-100"
                      onClick={() => handleGenerateQr('artwork', artwork.id)}
                    >
                      QR
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-stone-300">Nothing to see here yet. You have no artworks in the database.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Your exhibitions" meta={`${exhibitions.length} items`}>
          <div className="space-y-3">
            {exhibitions.length ? exhibitions.slice(0, 5).map((exhibition) => (
              <div key={exhibition.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-stone-50">{exhibition.title}</p>
                    <p className="text-sm text-stone-300">{exhibition.location || 'No location'}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-amber-200 hover:text-amber-100"
                    onClick={() => handleGenerateQr('exhibition', exhibition.id)}
                  >
                    QR
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-stone-300">Nothing to see here yet. You have no exhibitions in the database.</p>}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="QR codes" meta={`${qrCodes.length} generated`}>
          <div className="space-y-3">
            {qrCodes.length ? qrCodes.slice(0, 6).map((qr) => (
              <div key={qr.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-stone-50">{qr.qr_slug}</p>
                    <p className="text-sm text-stone-300">{qr.entity_type}</p>
                  </div>
                  {qr.qr_image_url ? (
                    <a className="text-sm text-amber-200 hover:text-amber-100" href={qr.qr_image_url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : null}
                </div>
              </div>
            )) : <p className="text-sm text-stone-300">Nothing to see here yet. No QR codes have been generated.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Engagement" meta="Comments and favorites">
          <div className="space-y-3 text-sm text-stone-300">
            <p>Comments: {comments.length}</p>
            <p>Favorites: {favorites.length}</p>
            <p>AI stays assistive only. All final publishing remains manual.</p>
          </div>
        </SectionCard>
      </div>

      {artworks[0]?.current_version_detail?.rendered_html ? (
        <SectionCard title="Latest statement preview" meta={artworks[0].title}>
          <div className="prose prose-invert max-w-none prose-headings:text-stone-50 prose-p:text-stone-300">
            <ReactMarkdown>{artworks[0].current_version_detail.markdown_statement || ''}</ReactMarkdown>
          </div>
        </SectionCard>
      ) : null}
    </section>
  )
}
