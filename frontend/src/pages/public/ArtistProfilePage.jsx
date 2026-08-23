import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, mediaUrl } from '../../lib/api'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { MapPin, Globe, Video } from 'lucide-react'

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
    </svg>
  )
}

function YoutubeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function PinterestIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  )
}

function TwitterIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

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
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#A1A1AA]">
            {profile.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                aria-label={`Visit ${artistName}'s Website`}
              >
                <Globe className="h-4 w-4 text-indigo-400" />
                <span>Website</span>
              </a>
            )}
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                aria-label={`Visit ${artistName}'s Instagram`}
              >
                <InstagramIcon className="h-4 w-4 text-pink-400" />
                <span>Instagram ({profile.instagram})</span>
              </a>
            )}
            {profile.twitter && (
              <a
                href={`https://x.com/${profile.twitter.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                aria-label={`Visit ${artistName}'s Twitter / X account`}
              >
                <TwitterIcon className="h-4 w-4 text-sky-400" />
                <span>Twitter / X ({profile.twitter})</span>
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors"
              >
                <LinkedinIcon className="h-4 w-4 text-blue-400" />
                <span>LinkedIn</span>
              </a>
            )}
            {profile.youtube && (
              <a
                href={profile.youtube.startsWith('http') ? profile.youtube : `https://${profile.youtube}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors"
              >
                <YoutubeIcon className="h-4 w-4 text-red-500" />
                <span>YouTube</span>
              </a>
            )}
            {profile.facebook && (
              <a
                href={profile.facebook.startsWith('http') ? profile.facebook : `https://${profile.facebook}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors"
              >
                <FacebookIcon className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </a>
            )}
            {profile.tiktok && (
              <a
                href={profile.tiktok.startsWith('http') ? profile.tiktok : `https://${profile.tiktok}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors"
              >
                <Video className="h-4 w-4 text-[#00f2fe]" />
                <span>TikTok</span>
              </a>
            )}
            {profile.pinterest && (
              <a
                href={profile.pinterest.startsWith('http') ? profile.pinterest : `https://${profile.pinterest}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-[#F4F4F5] transition-colors"
              >
                <PinterestIcon className="h-4 w-4 text-red-600" />
                <span>Pinterest</span>
              </a>
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