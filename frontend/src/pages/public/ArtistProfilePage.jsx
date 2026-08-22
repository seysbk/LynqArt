import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { MapPin, Globe, Share2 } from 'lucide-react'

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

  if (loading) return <LoadingState title="Loading Artist Portfolio" description="Fetching bio and artworks..." />
  if (!profile) return <EmptyState title="Artist Profile Not Found" description="This artist profile is not available." />

  const artistName = profile.user?.full_name || profile.user?.username || 'Artist'

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Editorial Portfolio Header (Section 39) */}
      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={mediaUrl(profile.avatar_url)} alt={artistName} className="h-16 w-16 rounded-full object-cover border border-white/[0.09]" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-[#191C27] border border-white/[0.09] flex items-center justify-center text-xl font-bold text-indigo-400">
                {artistName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F4F4F5]">{artistName}</h1>
              {profile.location && (
                <p className="text-xs text-[#A1A1AA] flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{profile.location}</span>
                </p>
              )}
            </div>
          </div>

          {/* Social & External Links */}
          <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#F4F4F5] transition-colors">
                <Globe className="h-4 w-4 text-indigo-400" />
                <span>Website</span>
              </a>
            )}
            {profile.instagram && (
              <span className="flex items-center gap-1">
                <Share2 className="h-4 w-4 text-indigo-400" />
                <span>{profile.instagram}</span>
              </span>
            )}
            {profile.twitter && (
              <span className="flex items-center gap-1">
                <Share2 className="h-4 w-4 text-indigo-400" />
                <span>{profile.twitter}</span>
              </span>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="pt-4 border-t border-white/[0.06] text-sm text-[#A1A1AA] leading-relaxed max-w-3xl">
            {profile.bio}
          </div>
        )}
      </div>

      {/* Published Portfolio Artworks (Section 39) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <h2 className="text-2xl font-bold text-[#F4F4F5]">Portfolio Artworks ({artworks.length})</h2>
        </div>

        {artworks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Public Artworks" description="This artist has not published any public portfolio works yet." />
        )}
      </section>
    </div>
  )
}