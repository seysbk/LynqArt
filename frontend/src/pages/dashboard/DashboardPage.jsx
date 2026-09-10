import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { ReportModerationPanel } from '../../components/ui/ReportModerationPanel'
import {
  Image,
  QrCode,
  MessageSquare,
  Heart,
  Plus,
  ShieldCheck,
  User,
  BarChart2,
  Eye,
  ExternalLink,
  Calendar,
  Sparkles,
  Layers,
  Globe,
  AlertTriangle,
} from 'lucide-react'

export function DashboardPage({ session }) {
  const user = session.user ?? {}
  const [profile, setProfile] = useState(null)
  const [artistProfile, setArtistProfile] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [exhibitions, setExhibitions] = useState([])
  const [qrCodes, setQrCodes] = useState([])
  const [analyticsSummary, setAnalyticsSummary] = useState({ total_views: 0, unique_visitors: 0, total_qr_scans: 0, unique_qr_visitors: 0, source_breakdown: [], artworks: [] })
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
      api.get('/artworks/', { params: { artist: user.id, ordering: '-created_at' } }),
      api.get('/exhibitions/', { params: { organizer: user.id, ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/qr/codes/', { params: { ordering: '-created_at' } }),
      api.get('/analytics/summary/').catch(() => ({ data: { total_views: 0, unique_visitors: 0, total_qr_scans: 0, unique_qr_visitors: 0, source_breakdown: [], artworks: [] } })),
      api.get('/comments/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/comments/favorites/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
      api.get('/ai/generations/', { params: { ordering: '-created_at' } }).catch(() => ({ data: { results: [] } })),
    ])
      .then(([profileRes, artistRes, artworksRes, exhRes, qrRes, summaryRes, commentsRes, favoritesRes, aiRes]) => {
        if (!alive) return
        setProfile(profileRes.data)
        setArtistProfile(artistRes.data)

        const allArtworks = artworksRes.data.results || artworksRes.data || []
        const allExhibitions = exhRes.data.results || exhRes.data || []
        const allQrCodes = qrRes.data.results || qrRes.data || []
        const allComments = commentsRes.data.results || commentsRes.data || []
        const allFavorites = favoritesRes.data.results || favoritesRes.data || []
        const allAi = aiRes.data.results || aiRes.data || []

        const myArtworks = allArtworks
        setArtworks(myArtworks)
        if (myArtworks.length > 0) setSelectedArtworkId(myArtworks[0].id)

        setExhibitions(allExhibitions.filter((exh) => exh.organizer?.id === user.id))
        setQrCodes(
          allQrCodes.filter((item) =>
            item.entity_type === 'artwork'
              ? myArtworks.some((art) => art.id === item.entity_id)
              : allExhibitions.some((exh) => exh.id === item.entity_id),
          ),
        )
        setAnalyticsSummary(summaryRes.data)
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

  const publishArtwork = async (slug) => {
    try {
      await api.patch(`/artworks/${slug}/`, { status: 'published' })
      setArtworks(artworks.map((item) => (item.slug === slug ? { ...item, status: 'published' } : item)))
      setStatusMessage('Artwork published successfully!')
    } catch {
      setStatusMessage('Could not publish artwork.')
    }
  }

  const publishExhibition = async (slug) => {
    try {
      await api.patch(`/exhibitions/${slug}/`, { status: 'published' })
      setExhibitions(exhibitions.map((item) => (item.slug === slug ? { ...item, status: 'published' } : item)))
      setStatusMessage('Exhibition published successfully!')
    } catch {
      setStatusMessage('Could not publish exhibition.')
    }
  }

  const selectedArtwork = useMemo(
    () => artworks.find((art) => art.id === selectedArtworkId) || artworks[0] || null,
    [artworks, selectedArtworkId],
  )

  const selectedArtworkQr = useMemo(
    () => qrCodes.find((qr) => qr.entity_type === 'artwork' && qr.entity_id === selectedArtwork?.id),
    [qrCodes, selectedArtwork],
  )

  const totalQrScans = analyticsSummary.total_qr_scans || 0
  const totalArtworkViews = analyticsSummary.total_views || 0

  const exhibitionQrScans = analyticsSummary.exhibition_qr_scans || 0

  const artworkAnalytics = useMemo(
    () => new Map((analyticsSummary.artworks || []).map((item) => [item.artwork, item])),
    [analyticsSummary],
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

      {user.is_staff && <ReportModerationPanel />}

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

        <div className="flex items-center gap-3 flex-wrap">
          {profile?.is_artist && profile?.id && (
            <Link
              to={`/artists/${profile.id}/${encodeURIComponent((profile.full_name || profile.username || '').toLowerCase().replace(/\s+/g, '-'))}`}
              target="_blank"
            >
              <Button variant="secondary" className="!py-1 !px-2.5 text-xs">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
                <span>Public Profile</span>
              </Button>
            </Link>
          )}

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
      </div>

      {/* Key Metrics Overview (Condensed 2-column grid on mobile devices < 640px) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="surface-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Artworks</span>
            <Image className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{artworks.length}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Created portfolio works</p>
        </div>

        <div className="surface-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>QR Codes</span>
            <QrCode className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{qrCodes.length}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Physical QR tags</p>
        </div>

        <div className="surface-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>QR Scans</span>
            <BarChart2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{totalQrScans}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Scan interactions</p>
        </div>

        <div className="surface-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Artwork Visits</span>
            <Eye className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{totalArtworkViews}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Public page visits</p>
        </div>

        <div className="surface-card p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Comments</span>
            <MessageSquare className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{comments.length}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Public discussion posts</p>
        </div>

        <div className="surface-card p-3.5 sm:p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#71717A]">
            <span>Bookmarks</span>
            <Heart className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#F4F4F5]">{favorites.length}</p>
          <p className="text-[10px] sm:text-[11px] text-[#71717A]">Bookmarked items</p>
        </div>
      </div>

      <section className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-1 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">Audience Reach</span>
            <h2 className="text-base font-bold text-[#F4F4F5]">Verified activity from your content</h2>
          </div>
          <p className="text-[11px] text-[#71717A]">Counts are recorded events, not estimates.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0D0F14] p-4">
            <p className="text-[11px] text-[#71717A]">Artwork page visits</p>
            <p className="mt-1 text-2xl font-extrabold text-sky-300">{totalArtworkViews}</p>
            <p className="mt-1 text-[10px] text-[#71717A]">Recorded from public artwork pages</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0D0F14] p-4">
            <p className="text-[11px] text-[#71717A]">QR link visits</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">{totalQrScans}</p>
            <p className="mt-1 text-[10px] text-[#71717A]">Physical QR resolutions</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0D0F14] p-4">
            <p className="text-[11px] text-[#71717A]">Total tracked reach</p>
            <p className="mt-1 text-2xl font-extrabold text-[#F4F4F5]">{totalArtworkViews + totalQrScans}</p>
            <p className="mt-1 text-[10px] text-[#71717A]">Artwork visits plus QR visits</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0D0F14] p-4">
            <p className="text-[11px] text-[#71717A]">Unique visitors</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-300">{analyticsSummary.unique_visitors || 0}</p>
            <p className="mt-1 text-[10px] text-[#71717A]">Privacy-safe artwork visitors</p>
          </div>
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0D0F14] p-4">
            <p className="text-[11px] text-[#71717A]">Unique QR visitors</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">{analyticsSummary.unique_qr_visitors || 0}</p>
            <p className="mt-1 text-[10px] text-[#71717A]">Privacy-safe scan visitors</p>
          </div>
        </div>
      </section>

      {/* EXHIBITION ANALYTICS & MANAGEMENT (FOR EXHIBITION ORGANIZERS ONLY) */}
      {user.can_manage_exhibitions && (
        <div className="surface-card p-6 space-y-6 border-emerald-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Exhibition Manager Analytics</span>
              <h2 className="text-lg font-bold text-[#F4F4F5] flex items-center gap-2 mt-0.5">
                <Layers className="h-5 w-5 text-emerald-400" />
                <span>Exhibitions Analytics &amp; Control</span>
              </h2>
            </div>

            <Link to="/dashboard/exhibitions/new">
              <Button variant="primary" className="!py-1.5 !px-3 text-xs bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4" />
                <span>Create New Exhibition</span>
              </Button>
            </Link>
          </div>

          {/* Exhibition Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-[#71717A]">Total Exhibitions</span>
              <p className="text-xl font-extrabold text-[#F4F4F5]">{exhibitions.length}</p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-[#71717A]">Published Catalogues</span>
              <p className="text-xl font-extrabold text-emerald-400">{exhibitions.filter((e) => e.status === 'published').length}</p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-[#71717A]">Draft Exhibitions</span>
              <p className="text-xl font-extrabold text-amber-400">{exhibitions.filter((e) => e.status === 'draft').length}</p>
            </div>
            <div className="p-3.5 rounded-[10px] bg-[#0D0F14] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium text-[#71717A]">Entrance QR Scans</span>
              <p className="text-xl font-extrabold text-[#F4F4F5]">{exhibitionQrScans}</p>
            </div>
          </div>

          {/* Exhibitions List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-[#A1A1AA]">Exhibitions Managed by You</h3>
            {exhibitions.length > 0 ? (
              <div className="space-y-2">
                {exhibitions.map((exh) => {
                  const isDraft = exh.status === 'draft'
                  return (
                    <div
                      key={exh.id}
                      className="p-3.5 rounded-[10px] bg-[#0D0F14] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        {exh.banner_image ? (
                          <img src={mediaUrl(exh.banner_image)} alt={exh.title} className="h-12 w-16 object-cover rounded shrink-0 border border-white/[0.08]" />
                        ) : (
                          <div className="h-12 w-16 bg-slate-900 rounded shrink-0 flex items-center justify-center text-[10px] text-[#71717A]">No Banner</div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#F4F4F5] truncate">{exh.title}</span>
                            {isDraft ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 inline" /> DRAFT (Private - Hidden from public)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                                PUBLISHED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#71717A] truncate">
                            {exh.location || 'Gallery'} · {exh.artworks?.length || 0} linked artworks
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isDraft && (
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => publishExhibition(exh.slug)}
                            className="!py-1 !px-2.5 text-[11px] bg-amber-600 hover:bg-amber-500"
                          >
                            Publish Now
                          </Button>
                        )}
                        <Link to={`/exhibitions/${exh.slug}`} target="_blank">
                          <Button variant="secondary" className="!py-1 !px-2.5 text-[11px]">
                            <ExternalLink className="h-3 w-3" />
                            <span>Public Page</span>
                          </Button>
                        </Link>
                        <Link to={`/dashboard/exhibitions/${exh.slug}/edit`}>
                          <Button variant="primary" className="!py-1 !px-2.5 text-[11px]">
                            Edit Exhibition
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#71717A]">No exhibitions created yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Detailed Artwork Analytics & Insights Section */}
      {artworks.length > 0 && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#F4F4F5] flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-400" />
                <span>Artwork Analytics</span>
              </h2>
              {selectedArtwork && (
                <p className="text-xs text-indigo-300 mt-1 font-medium bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-[6px] inline-block">
                  Currently viewing analytics for: <span className="font-bold text-white">{selectedArtwork.title}</span>. Select another artwork to change project.
                </p>
              )}
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

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#F4F4F5]">{selectedArtwork.title}</h3>
                    {selectedArtwork.status === 'draft' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 inline" /> DRAFT (Private)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                        PUBLISHED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] capitalize">{selectedArtwork.medium || 'Mixed Media'}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedArtwork.status === 'draft' && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => publishArtwork(selectedArtwork.slug)}
                      className="!py-1 !px-2.5 text-[11px] bg-amber-600 hover:bg-amber-500"
                    >
                      Publish Now
                    </Button>
                  )}
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
                  <span className="text-[11px] font-medium text-[#71717A]">Public Visits</span>
                  <p className="text-2xl font-extrabold text-sky-300">{artworkAnalytics.get(selectedArtwork?.id)?.views || 0}</p>
                  <p className="text-[10px] text-[#71717A]">Artwork page views</p>
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

                <div className="sm:col-span-3 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-[#71717A]"><Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI statement history</span>
                    <span className="text-[10px] text-[#71717A]">{aiGenerations.filter((gen) => gen.artwork === selectedArtwork.id || gen.artwork_detail?.id === selectedArtwork.id).length} drafts</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {aiGenerations.filter((gen) => gen.artwork === selectedArtwork.id || gen.artwork_detail?.id === selectedArtwork.id).slice(0, 3).map((gen) => (
                      <div key={gen.id} className="flex items-center justify-between gap-2 rounded bg-[#141720] px-2.5 py-2 text-[10px]">
                        <span className="truncate text-[#A1A1AA]">{gen.prompt || 'Draft statement'} · {gen.model_used || 'AI assistant'}</span>
                        <span className={gen.accepted ? 'shrink-0 text-emerald-300' : 'shrink-0 text-[#71717A]'}>{gen.accepted ? 'Accepted' : 'Draft'}</span>
                      </div>
                    ))}
                  </div>
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
              artworks.slice(0, 6).map((art) => {
                const isDraft = art.status === 'draft'
                return (
                  <div key={art.id} className="flex items-center justify-between gap-3 p-2.5 rounded-[9px] bg-[#0D0F14] border border-white/[0.06]">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-[#F4F4F5] truncate">{art.title}</p>
                        {isDraft ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[9px]">
                            DRAFT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[9px]">
                            PUBLISHED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#71717A] capitalize">{art.medium || 'Artwork'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => publishArtwork(art.slug)}
                          className="text-xs text-amber-400 hover:underline font-semibold"
                        >
                          Publish
                        </button>
                      )}
                      <Link to={`/artworks/${art.slug}`} className="text-xs text-[#A1A1AA] hover:text-white">View</Link>
                      <Link to={`/dashboard/artworks/${art.slug}/edit`} className="text-xs text-indigo-400 hover:underline">Edit</Link>
                    </div>
                  </div>
                )
              })
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
              qrCodes.slice(0, 6).map((qr) => (
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

    </div>
  )
}
