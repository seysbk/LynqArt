import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ArtworkCard, formatAttribution } from '../../components/ui/ArtworkCard'
import { ExhibitionCard } from '../../components/ui/ExhibitionCard'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
import { useDataRefresh } from '../../hooks/useDataRefresh'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function isUpcoming(exhibition) {
  if (!exhibition?.start_date) return true
  const start = new Date(`${exhibition.start_date}T00:00:00`)
  return start >= new Date()
}

export function HomePage({ session }) {
  const [exhibitions, setExhibitions] = useState([])
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const { registerArtworksRefetchListener, registerExhibitionsRefetchListener } = useDataRefresh()

  const fetchData = useCallback(async () => {
    let alive = true
    try {
      const [exhibitionsRes, artworksRes] = await Promise.all([
        api.get('/exhibitions/', { params: { ordering: '-created_at' } }),
        api.get('/artworks/', { params: { status: 'published', ordering: '-created_at' } }),
      ])
      if (!alive) return
      setExhibitions(exhibitionsRes.data.results || exhibitionsRes.data || [])
      setArtworks(artworksRes.data.results || artworksRes.data || [])
      setLoading(false)
    } catch {
      if (!alive) return
      setLoading(false)
    }
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch artworks when browser regains focus
  useRefetchOnFocus(fetchData)

  // Register this component as a listener for artwork and exhibition refetch events
  useEffect(() => {
    const unsubscribeArtworks = registerArtworksRefetchListener(fetchData)
    const unsubscribeExhibitions = registerExhibitionsRefetchListener(fetchData)
    return () => {
      unsubscribeArtworks()
      unsubscribeExhibitions()
    }
  }, [fetchData, registerArtworksRefetchListener, registerExhibitionsRefetchListener])

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

  // Featured artworks checked by admin (is_featured = true)
  const featuredArtworks = useMemo(() => {
    return artworks.filter((item) => item.status === 'published' && item.is_featured)
  }, [artworks])

  // Auto-loop carousel every 5 seconds if multiple featured works exist
  useEffect(() => {
    if (featuredArtworks.length <= 1) return
    const timer = setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featuredArtworks.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredArtworks.length])

  const nextSlide = () => {
    if (featuredArtworks.length) {
      setFeaturedIndex((current) => (current + 1) % featuredArtworks.length)
    }
  }

  const prevSlide = () => {
    if (featuredArtworks.length) {
      setFeaturedIndex((current) => (current - 1 + featuredArtworks.length) % featuredArtworks.length)
    }
  }

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX)
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!featuredArtworks.length) return
    if (touchStartX - touchEndX > 40) {
      nextSlide()
    } else if (touchEndX - touchStartX > 40) {
      prevSlide()
    }
  }

  const heroArtwork = featuredArtworks[featuredIndex] || null

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
                <Link to="/profile">
                  <Button variant="secondary">Start Artist Profile</Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button variant="secondary">Become an Artist</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Hero Visual Right Column (Featured Artworks Carousel / Swiper) */}
          <div className="lg:col-span-5">
            {featuredArtworks.length > 0 ? (
              <div
                className="surface-card overflow-hidden group relative select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D0F14]">
                  <img
                    src={mediaUrl(heroArtwork.images?.[0]?.image_url || heroArtwork.banner_image)}
                    alt={heroArtwork.title}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F14]/95 via-[#0D0F14]/30 to-transparent opacity-90" />

                  {/* Navigation Arrows */}
                  {featuredArtworks.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-indigo-600 focus:outline-none cursor-pointer"
                        aria-label="Previous featured artwork"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-indigo-600 focus:outline-none cursor-pointer"
                        aria-label="Next featured artwork"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Card Content & See More Button */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mb-1">
                        Featured Artwork {featuredArtworks.length > 1 ? `(${featuredIndex + 1} of ${featuredArtworks.length})` : ''}
                      </span>
                      <h3 className="text-lg font-bold text-[#F4F4F5] truncate">{heroArtwork.title}</h3>
                      <p className="text-xs text-[#A1A1AA] truncate">
                        By {formatAttribution(heroArtwork)}
                      </p>
                    </div>
                    <Link to={`/artworks/${heroArtwork.slug}`}>
                      <Button variant="primary" className="!py-1.5 !px-3 text-xs shrink-0">
                        See More
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Dot Indicators */}
                {featuredArtworks.length > 1 && (
                  <div className="flex items-center justify-center gap-2 py-3 bg-[#0D0F14]/80">
                    {featuredArtworks.map((art, idx) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setFeaturedIndex(idx)}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          idx === featuredIndex ? 'w-7 bg-indigo-500' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                        }`}
                        aria-label={`Go to featured slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
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