import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { MapPin, Calendar } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return 'Pending'
  try {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(value)
  }
}

export function ExhibitionPage() {
  const { exhibitionSlug } = useParams()
  const [exhibition, setExhibition] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .get(`/exhibitions/${exhibitionSlug}/`)
      .then(({ data }) => {
        if (!alive) return
        setExhibition(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [exhibitionSlug])

  if (loading) return <LoadingState title="Loading Exhibition Catalogue" description="Fetching catalogue details..." />
  if (!exhibition) return <EmptyState title="Exhibition Not Found" description="This exhibition catalogue does not exist or is private." />

  const artworks = exhibition.artworks || []
  const bannerImage = mediaUrl(exhibition.banner_image)

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* 1. Exhibition Banner (Section 38 Structure) */}
      <div className="surface-card overflow-hidden">
        {bannerImage ? (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-[#0D0F14]">
            <img src={bannerImage} alt={exhibition.title} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Digital Catalogue Archive
            </span>
            {exhibition.is_featured && (
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F4F4F5]">{exhibition.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1AA]">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-indigo-400" />
              <span>{exhibition.location || 'Gallery Location'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span>{formatDate(exhibition.start_date)} &rarr; {formatDate(exhibition.end_date)}</span>
            </span>
          </div>

          {exhibition.short_description && (
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-3xl">
              {exhibition.short_description}
            </p>
          )}
        </div>
      </div>

      {/* Curator Description */}
      {exhibition.markdown_description && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Curator Statement</h2>
          <div className="prose prose-invert max-w-[750px] text-sm text-[#F4F4F5] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{exhibition.markdown_description}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* 2. Exhibition Artworks Collection (Section 38) */}
      <section className="space-y-6 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#F4F4F5]">Catalogue Artworks ({artworks.length})</h2>
        </div>

        {artworks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map((item) => {
              const artwork = item.artwork_detail || item
              return <ArtworkCard key={item.id || artwork.id} artwork={artwork} />
            })}
          </div>
        ) : (
          <EmptyState title="No Linked Artworks" description="No artworks have been added to this exhibition catalogue yet." />
        )}
      </section>
    </div>
  )
}