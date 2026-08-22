import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { Image, QrCode, MessageSquare, Heart, Plus, ShieldCheck, User, BarChart2, Eye, ExternalLink, Calendar, Sparkles } from 'lucide-react'

export function DashboardPage({ session }) {
  const user = session.user ?? {}
  const [profile, setProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [exhibitions, setExhibitions] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [comments, setComments] = useState([])
  const [favorites, setFavorites] = useState([])
  const [aiGenerations, setAiGenerations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [selectedArtworkId, setSelectedArtworkId] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/accounts/profile/'),
      api.get('/accounts/artist-profile/').catch(() => ({ data: null })),
      api.get('/artworks/', { params: { ordering: '-created_at' } }),
      api.get('/exhibitions/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/qr/codes/', { params: { ordering: '-created_at' } }),
      api.get('/comments/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/comments/favorites/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/ai/generations/').catch(() => ({ data: { results: [] } })),
    ])
      .then(([profileRes, artistRes, artworksRes, exhRes, qrRes, commentsRes, favoritesRes, aiRes]) => {
        if (!alive) return
        setProfile(profileRes.data)
        setArtistProfile(artistRes.data)

        const allArtworks = artworksRes.data.results || artworksRes.data || []
        const allExhibitions = exhRes.data.results || exhRes.data || []
        const allQrCodes = qrRes.data.results || qrRes.data || []
        const allComments = commentsRes.data.results || commentsRes.data || []
        const allFavorites = favoritesRes.data.results || favoritesRes.data || []
        const allAi = aiRes.data.results || aiRes.data || []

        const myArtworks = allArtworks.filter((item) => item.artist?.id === user.id)
        setArtworks(myArtworks)
        if (myArtworks.length > 0) setSelectedArtworkId(myArtworks[0].id)

        setExhibitions(allExhibitions.filter((exh) => exh.organizer?.id === user.id))
        setQrCodes(
          allQrCodes.filter((item) =>
            item.entity_type === 'artwork'
              ? myArtworks.some((art) => art.id === item.entity_id)
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

  const selectedArtwork = useMemo(
    () => artworks.find((art) => art.id === selectedArtworkId) || artworks[0] || null,
    [artworks, selectedArtworkId],
  )

  const selectedArtworkQr = useMemo(
    () => qrCodes.find((qr) => qr.entity_type === 'artwork' && qr.entity_id === selectedArtwork?.id),
    [qrCodes, selectedArtwork],
  )

  const totalQrScans = useMemo(
    () => qrCodes.reduce((sum, item) => sum + (item.scans || 0), 0),
    [qrCodes],
  )

  if (loading) return <LoadingState title="Loading Analytics & Workspace" description="Fetching performance metrics..." />

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Analytics &amp; Content Management</span>
          <h1 className="text-3xl font-extrabold text-[#F4F4F5]">Dashboard Workspace</h1>
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

          <Link to="/profile">
            <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
              <User className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
          {statusMessage}
        </div>
      )}

      {/* Account Info Bar */}
      <div className="surface-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {artistProfile?.avatar_url ? (
            <img src={mediaUrl(artistProfile.avatar_url)} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-white/[0.09]" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/[0.09] flex items-center justify-center text-indigo-400 font-bold">
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
            </div>
          )}
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

      {/* Key Metrics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Published Artworks</span>
            <Image className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{artworks.length}</p>
          <p className="text-[11px] text-[#71717A]">Created portfolio works</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>QR Codes</span>
            <QrCode className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{qrCodes.length}</p>
          <p className="text-[11px] text-[#71717A]">Physical exhibition tags</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Total QR Scans</span>
            <BarChart2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{totalQrScans}</p>
          <p className="text-[11px] text-[#71717A]">Scan interactions</p>
        </div>

        <div className="surface-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Comments</span>
            <MessageSquare className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-[#F4F4F5]">{comments.length}</p>
          <p className="text-[11px] text-[#71717A]">Public discussion posts</p>
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

      {/* Detailed Artwork Analytics & Insights Section */}
      {artworks.length > 0 && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#F4F4F5] flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-400" />
                <span>Artwork Deep Analytics</span>
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">Select an artwork to view detailed performance metrics</p>
            </div>

            <select
              value={selectedArtworkId || ''}
              onChange={(e) => setSelectedArtworkId(e.target.value)}
              className="rounded-[9px] bg-[#0D0F14] border border-white/[0.09] px-3 py-2 text-xs text-[#F4F4F5] outline-none"
            >
              {artworks.map((art) => (
                <option key={art.id} value={art.id}>{art.title}</option>
              ))}
            </select>
          </div>

          {selectedArtwork && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* Left Column: Artwork Thumbnail & Basic Specs */}
              <div className="lg:col-span-4 space-y-3">
                <div className="aspect-[4/3] rounded-[10px] overflow-hidden bg-[#0D0F14] border border-white/[0.06]">
                  {selectedArtwork.banner_image || selectedArtwork.images?.[0]?.image_url ? (
                    <img
                      src={mediaUrl(selectedArtwork.banner_image || selectedArtwork.images[0].image_url)}
                      alt={selectedArtwork.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#71717A]">No Image</div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F4F4F5]">{selectedArtwork.title}</h3>
                  <p className="text-xs text-[#71717A] capitalize">{selectedArtwork.status} · {selectedArtwork.medium || 'Mixed Media'}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link to={`/artworks/${selectedArtwork.slug}`} target="_blank">
                    <Button variant="secondary" className="!py-1 !px-2.5 text-[11px]">
                      <ExternalLink className="h-3 w-3" />
                      <span>Public Page</span>
                    </Button>
                  </Link>
                  <Link to={`/dashboard/artworks/${selectedArtwork.slug}/edit`}>
                    <Button variant="primary" className="!py-1 !px-2.5 text-[11px]">Edit Artwork</Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Key Engagement Metrics */}
              <div className="lg:col-span-8 grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-medium text-[#71717A]">QR Code Scans</span>
                  <p className="text-2xl font-extrabold text-[#F4F4F5]">{selectedArtworkQr?.scans || 0}</p>
                  <p className="text-[10px] text-[#71717A]">Physical tag visits</p>
                </div>

                <div className="p-4 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-medium text-[#71717A]">Statement Versions</span>
                  <p className="text-2xl font-extrabold text-[#F4F4F5]">{selectedArtwork.versions?.length || 1}</p>
                  <p className="text-[10px] text-[#71717A]">Markdown edit history</p>
                </div>

                <div className="p-4 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
                  <span className="text-[11px] font-medium text-[#71717A]">Category &amp; Tags</span>
                  <p className="text-xs font-semibold text-[#F4F4F5] truncate">
                    {selectedArtwork.category_detail?.name || 'Uncategorized'}
                  </p>
                  <p className="text-[10px] text-[#71717A] truncate">
                    {selectedArtwork.tags?.map((t) => t.name).join(', ') || 'No tags'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Management Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Artwork Management List */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F4F5]">Your Artworks ({artworks.length})</h2>
            {profile?.is_artist && (
              <Link to="/dashboard/artworks/new" className="text-xs text-indigo-400 hover:underline">
                + New Artwork
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
              <p className="text-xs text-[#71717A] py-2">No artworks uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Physical QR Codes List */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold text-[#F4F4F5]">Physical QR Tags ({qrCodes.length})</h2>
          </div>

          <div className="space-y-2">
            {qrCodes.length > 0 ? (
              qrCodes.slice(0, 5).map((qr) => (
                <div key={qr.id} className="flex items-center justify-between gap-3 p-2.5 rounded-[9px] bg-[#0D0F14] border border-white/[0.06]">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-[#F4F4F5] truncate">{qr.qr_slug}</p>
                    <p className="text-[10px] text-[#71717A] uppercase">{qr.entity_type} · {qr.scans || 0} scans</p>
                  </div>
                  {qr.qr_image_url && (
                    <a href={mediaUrl(qr.qr_image_url)} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">
                      Open QR Image
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#71717A] py-2">No QR tags generated yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Generations Audit Log */}
      {profile?.is_artist && (
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F4F4F5] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>AI Writing History ({aiGenerations.length})</span>
              </h2>
              <p className="text-[11px] text-[#71717A]">Audit log of AI-assisted draft statement generations</p>
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
