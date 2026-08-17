import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Image, QrCode, MessageSquare, Heart, Plus, ShieldCheck, User } from 'lucide-react'

export function DashboardPage({ session }) {
  const user = session.user ?? {}
  const [profile, setProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [comments, setComments] = useState([])
  const [favorites, setFavorites] = useState([])
  const [aiGenerations, setAiGenerations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [showArtistOnboarding, setShowArtistOnboarding] = useState(false)
  const [onboarding, setOnboarding] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/accounts/profile/'),
      api.get('/accounts/artist-profile/').catch(() => ({ data: null })),
      api.get('/artworks/', { params: { ordering: '-created_at' } }),
      api.get('/qr/codes/', { params: { ordering: '-created_at' } }),
      api.get('/comments/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/comments/favorites/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/ai/generations/').catch(() => ({ data: { results: [] } })),
    ])
      .then(([profileRes, artistRes, artworksRes, qrRes, commentsRes, favoritesRes, aiRes]) => {
        if (!alive) return
        setProfile(profileRes.data)
        setArtistProfile(artistRes.data)

        const allArtworks = artworksRes.data.results || artworksRes.data || []
        const allQrCodes = qrRes.data.results || qrRes.data || []
        const allComments = commentsRes.data.results || commentsRes.data || []
        const allFavorites = favoritesRes.data.results || favoritesRes.data || []
        const allAi = aiRes.data.results || aiRes.data || []

        setArtworks(allArtworks.filter((item) => item.artist?.id === user.id))
        setQrCodes(
          allQrCodes.filter((item) =>
            item.entity_type === 'artwork'
              ? allArtworks.some((artwork) => artwork.id === item.entity_id && artwork.artist?.id === user.id)
              : true,
          ),
        )
        setComments(allComments.filter((item) => item.user?.id === user.id))
        setFavorites(allFavorites.filter((item) => item.user?.id === user.id))
        setAiGenerations(allAi)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [user.id])

  const handleBecomeArtist = async (event) => {
    event.preventDefault()
    try {
      await api.patch('/accounts/profile/', { first_name: onboarding.first_name, last_name: onboarding.last_name })
      const { data } = await api.post('/accounts/become-artist/', {
        bio: onboarding.bio,
        location: onboarding.location,
        phone: onboarding.phone,
        website: onboarding.website,
      })
      setProfile(data.user)
      setArtistProfile(data.artist_profile)
      setStatusMessage('Artist status activated!')
      setShowArtistOnboarding(false)
    } catch {
      setStatusMessage('Please complete name, bio, and location details.')
    }
  }

  if (loading) return <LoadingState title="Loading Dashboard" description="Fetching user workspace..." />

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Creator Workspace</span>
          <h1 className="text-3xl font-extrabold text-[#F4F4F5]">Dashboard</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile?.is_artist && (
            <Link to="/dashboard/artworks/new">
              <Button variant="primary" className="!py-1.5 !px-3 text-xs">
                <Plus className="h-4 w-4" />
                <span>Upload Artwork</span>
              </Button>
            </Link>
          )}

          {user.can_manage_exhibitions && (
            <Link to="/dashboard/exhibitions/new">
              <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                <Plus className="h-4 w-4" />
                <span>Create Exhibition</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
          {statusMessage}
        </div>
      )}

      {/* Account Info Surface */}
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-indigo-400">
            {profile?.is_artist ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F4F4F5]">{profile?.full_name || profile?.username}</p>
            <p className="text-xs text-[#71717A]">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#A1A1AA]">
          <span>Role:</span>
          {profile?.is_artist ? (
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Artist</span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[#A1A1AA]">Regular User</span>
          )}
          {user.is_expert && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Lecturer</span>}
          {user.can_manage_exhibitions && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Organizer</span>}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Artworks</span>
            <Image className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{artworks.length}</p>
          <p className="text-[11px] text-[#71717A]">{profile?.is_artist ? 'Published & drafts' : 'Become artist to publish'}</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>QR Codes</span>
            <QrCode className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{qrCodes.length}</p>
          <p className="text-[11px] text-[#71717A]">Generated physical tags</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Comments</span>
            <MessageSquare className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{comments.length}</p>
          <p className="text-[11px] text-[#71717A]">Discussion posts</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Favorites</span>
            <Heart className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{favorites.length}</p>
          <p className="text-[11px] text-[#71717A]">Bookmarked works</p>
        </div>
      </div>

      {/* Become Artist Banner */}
      {!profile?.is_artist && (
        <div className="surface-card p-6 space-y-4">
          {!showArtistOnboarding ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#F4F4F5]">Become an Artist</h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Publish artworks, write Markdown artist statements, generate QR code tags, and view analytics.
                </p>
              </div>
              <Button variant="primary" onClick={() => setShowArtistOnboarding(true)} className="!py-1.5 text-xs">
                Activate Artist Role
              </Button>
            </div>
          ) : (
            <form onSubmit={handleBecomeArtist} className="space-y-3 pt-1">
              <h3 className="text-sm font-semibold text-[#F4F4F5]">Artist Profile Setup</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={onboarding.first_name}
                  onChange={(e) => setOnboarding({ ...onboarding, first_name: e.target.value })}
                  placeholder="First Name *"
                  className="rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-2.5 text-xs text-[#F4F4F5]"
                />
                <input
                  required
                  value={onboarding.last_name}
                  onChange={(e) => setOnboarding({ ...onboarding, last_name: e.target.value })}
                  placeholder="Last Name *"
                  className="rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-2.5 text-xs text-[#F4F4F5]"
                />
              </div>
              <textarea
                required
                rows={3}
                value={onboarding.bio}
                onChange={(e) => setOnboarding({ ...onboarding, bio: e.target.value })}
                placeholder="Artist Bio &amp; Practice *"
                className="w-full rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-2.5 text-xs text-[#F4F4F5]"
              />
              <input
                required
                value={onboarding.location}
                onChange={(e) => setOnboarding({ ...onboarding, location: e.target.value })}
                placeholder="Location *"
                className="w-full rounded-[9px] bg-[#0D0F14] border border-white/[0.09] p-2.5 text-xs text-[#F4F4F5]"
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" className="!py-1.5 text-xs">Complete Setup</Button>
                <Button variant="secondary" onClick={() => setShowArtistOnboarding(false)} className="!py-1.5 text-xs">Cancel</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Management Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Artwork Management List */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F4F5]">Your Artworks ({artworks.length})</h2>
            {profile?.is_artist && (
              <Link to="/dashboard/artworks/new" className="text-xs text-indigo-400 hover:underline">
                + New
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {artworks.length > 0 ? (
              artworks.slice(0, 5).map((art) => (
                <div key={art.id} className="flex items-center justify-between gap-3 p-2.5 rounded-[9px] bg-[#0D0F14] border border-white/[0.06]">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#F4F4F5] truncate">{art.title}</p>
                    <p className="text-[10px] text-[#71717A] capitalize">{art.status} · {art.medium || 'Artwork'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/artworks/${art.slug}`} className="text-xs text-[#A1A1AA] hover:text-white">View</Link>
                    <Link to={`/dashboard/artworks/${art.slug}/edit`} className="text-xs text-indigo-400 hover:underline">Edit</Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#71717A] py-2">No artworks added yet.</p>
            )}
          </div>
        </div>

        {/* QR Codes Management List */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F4F5]">Generated Physical QR Tags ({qrCodes.length})</h2>
          </div>

          <div className="space-y-2">
            {qrCodes.length > 0 ? (
              qrCodes.slice(0, 5).map((qr) => (
                <div key={qr.id} className="flex items-center justify-between gap-3 p-2.5 rounded-[9px] bg-[#0D0F14] border border-white/[0.06]">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-[#F4F4F5] truncate">{qr.qr_slug}</p>
                    <p className="text-[10px] text-[#71717A] uppercase">{qr.entity_type}</p>
                  </div>
                  {qr.qr_image_url && (
                    <a href={mediaUrl(qr.qr_image_url)} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">
                      Open QR Image
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#71717A] py-2">No physical QR codes generated yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Writing Generations Audit Log */}
      {profile?.is_artist && (
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F4F4F5]">AI Writing Generations Audit Log ({aiGenerations.length})</h2>
              <p className="text-[11px] text-[#71717A]">History of AI-drafted statements and artist review approvals</p>
            </div>
          </div>

          <div className="space-y-2">
            {aiGenerations.length > 0 ? (
              aiGenerations.slice(0, 5).map((gen) => (
                <div key={gen.id} className="flex items-center justify-between gap-3 p-3 rounded-[9px] bg-[#0D0F14] border border-white/[0.06] text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F4F4F5] truncate">
                      {gen.artwork_detail?.title ? `Artwork: ${gen.artwork_detail.title}` : 'Statement Draft'}
                    </p>
                    <p className="text-[10px] text-[#71717A] truncate">
                      Prompt: "{gen.prompt || 'Draft statement'}" · Model: {gen.model_used || 'AI Assistant'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    gen.accepted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-[#A1A1AA]'
                  }`}>
                    {gen.accepted ? 'Accepted & Inserted' : 'Draft Generated'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#71717A] py-2">No AI statement generations drafted yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
