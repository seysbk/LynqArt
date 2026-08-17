import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { ExhibitionCard } from '../../components/ui/ExhibitionCard'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'

function isUpcoming(exhibition) {
  if (!exhibition?.start_date) return true
  const start = new Date(`${exhibition.start_date}T00:00:00`)
  return start >= new Date()
}

export function HomePage({ session }) {
  const [exhibitions, setExhibitions] = useState([])
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('/exhibitions/', { params: { ordering: '-created_at' } }),
      api.get('/artworks/', { params: { status: 'published', ordering: '-created_at' } }),
    ])
      .then(([exhibitionsRes, artworksRes]) => {
        if (!alive) return
        setExhibitions(exhibitionsRes.data.results || exhibitionsRes.data || [])
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
  }, [])

  // Published exhibitions logic (Section 28)
  const publishedExhibitions = useMemo(() => {
    return exhibitions.filter(
      (item) => item.status === 'published' && item.show_on_homepage !== false,
    )
  }, [exhibitions])

  // Published artworks ONLY (Section 30)
  const publishedArtworks = useMemo(() => {
    return artworks.filter((item) => item.status === 'published').slice(0, 6)
  }, [artworks])

  const heroArtwork = publishedArtworks[0] || null

  if (loading) {
    return <LoadingState title="Loading LynqArt Archive" description="Fetching public exhibitions and artworks..." />
  }

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* 1. Hero Section (Section 23 & 24): min-height 100dvh */}
      <section className="min-h-[calc(100dvh-120px)] flex flex-col justify-center py-6 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Hero Content Left Column */}
          <div className="space-y-6 lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Digital Archive &amp; Physical Exhibitions
            </p>

            <h1 className="text-4xl font-extrabold tracking-tight text-[#F4F4F5] sm:text-6xl lg:text-6xl leading-[1.1]">
              ART HAS A STORY.
            </h1>

            <p className="text-lg sm:text-xl text-[#A1A1AA] leading-relaxed max-w-[650px]">
              Discover artworks, exhibitions, and the statements behind them. LynqArt connects physical gallery pieces to permanent digital experiences through QR codes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/explore">
                <Button variant="primary">Explore Artworks</Button>
              </Link>

              {session.user?.is_artist ? (
                <Link to="/dashboard/artworks/new">
                  <Button variant="secondary">Upload Artwork</Button>
                </Link>
              ) : session.user ? (
                <Link to="/dashboard">
                  <Button variant="secondary">Become an Artist</Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button variant="secondary">Become an Artist</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Hero Visual Right Column (Gallery Presentation) */}
          <div className="lg:col-span-5">
            {heroArtwork ? (
              <div className="surface-card overflow-hidden group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D0F14]">
                  <img
                    src={mediaUrl(heroArtwork.images?.[0]?.image_url || heroArtwork.banner_image)}
                    alt={heroArtwork.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14]/90 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-300">
                      Featured Artwork
                    </span>
                    <h3 className="text-lg font-bold text-[#F4F4F5] truncate">{heroArtwork.title}</h3>
                    <p className="text-xs text-[#A1A1AA]">
                      by {heroArtwork.artist?.full_name || heroArtwork.artist?.username || 'Artist'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-12 text-center text-xs text-[#71717A] aspect-[4/3] flex flex-col items-center justify-center space-y-2">
                <span className="text-indigo-400 text-sm font-semibold">LynqArt Archive</span>
                <span>Bridging physical exhibitions to permanent digital records.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Recently Uploaded Exhibitions (Bento Grid Layout - Section 27, 28, 31, 32) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">Recently Uploaded Exhibitions</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Curated catalog archives and physical gallery showcases</p>
          </div>
          {publishedExhibitions.length > 0 && (
            <Link to="/explore?type=exhibitions" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              View All &rarr;
            </Link>
          )}
        </div>

        {publishedExhibitions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedExhibitions.map((exhibition, idx) => (
              <div key={exhibition.id} className={idx === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}>
                <ExhibitionCard exhibition={exhibition} featured={idx === 0} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing to see here yet."
            description="New exhibitions will appear here when they are published."
          />
        )}
      </section>

      {/* 3. Recently Uploaded Artworks (Bento Grid Layout - Section 27, 30, 31, 32) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">Recently Uploaded Artworks</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Published statements and physical gallery entries</p>
          </div>
          {publishedArtworks.length > 0 && (
            <Link to="/explore" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
              Explore All &rarr;
            </Link>
          )}
        </div>

        {publishedArtworks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing to see here yet."
            description="New published artworks will appear here once added by artists."
          />
        )}
      </section>
    </div>
  )
}