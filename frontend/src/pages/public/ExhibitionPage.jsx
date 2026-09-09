import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { shareLink, sharePreviewUrl } from '../../lib/sharing'
import { ArtworkCard } from '../../components/ui/ArtworkCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Button } from '../../components/ui/Button'
import { MapPin, Calendar, QrCode, Share2, Flag } from 'lucide-react'
import { ReportContentModal } from '../../components/ui/ReportContentModal'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
import { useDataRefresh } from '../../hooks/useDataRefresh'

const list = (data) => data?.results || data || []

const setMeta = (selector, attribute, value) => {
  const element = document.querySelector(selector) || document.head.appendChild(Object.assign(document.createElement('meta'), { [attribute]: selector.match(/"([^"]+)"/)[1] }))
  element.setAttribute(attribute, value || '')
}

const updateSocialMetadata = (exhibition) => {
  const description = (exhibition.short_description || exhibition.markdown_description || `Explore ${exhibition.title} on LynqArt.`).slice(0, 200)
  const image = mediaUrl(exhibition.banner_image)
  const url = window.location.href
  setMeta('meta[name="description"]', 'name', description)
  setMeta('meta[property="og:title"]', 'property', exhibition.title)
  setMeta('meta[property="og:description"]', 'property', description)
  setMeta('meta[property="og:type"]', 'property', 'website')
  setMeta('meta[property="og:url"]', 'property', url)
  setMeta('meta[property="og:image"]', 'property', image)
  setMeta('meta[property="og:image:alt"]', 'property', exhibition.title)
  setMeta('meta[name="twitter:card"]', 'name', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name', exhibition.title)
  setMeta('meta[name="twitter:description"]', 'name', description)
  setMeta('meta[name="twitter:image"]', 'name', image)
  const icon = document.querySelector('link[rel="apple-touch-icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'apple-touch-icon' }))
  icon.setAttribute('href', image)
}

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
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [reportTarget, setReportTarget] = useState(null)
  const { registerExhibitionsRefetchListener } = useDataRefresh()

  const fetchData = useCallback(async () => {
    let alive = true
    api
      .get(`/exhibitions/${exhibitionSlug}/`)
      .then(async ({ data }) => {
        if (!alive) return
        setExhibition(data)
        document.title = `${data.title} | LynqArt`
        updateSocialMetadata(data)
        const qr = await api.get('/qr/codes/', { params: { entity_type: 'exhibition', entity_id: data.id } }).catch(() => ({ data: [] }))
        if (!alive) return
        setQrCode(list(qr.data)[0] || null)
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch when browser regains focus
  useRefetchOnFocus(fetchData)

  // Register this component as a listener for exhibition refetch events
  useEffect(() => {
    return registerExhibitionsRefetchListener(fetchData)
  }, [fetchData, registerExhibitionsRefetchListener])

  const shareExhibition = async () => {
    const url = sharePreviewUrl('exhibitions', exhibition.slug)
    try {
      const result = await shareLink({ title: exhibition.title, text: `Explore ${exhibition.title} on LynqArt`, url })
      if (result === 'copied') setMessage('Exhibition link copied to clipboard.')
      if (result === 'shared') setMessage('Exhibition link ready to share.')
    } catch {
      setMessage('Could not share the exhibition link. Please try again.')
    }
  }

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

          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-4">
            <Button variant="secondary" onClick={shareExhibition} className="!py-1.5 !px-3 text-xs">
              <Share2 className="h-4 w-4" />
              <span>Share Exhibition</span>
            </Button>
            {qrCode?.qr_image_url && (
              <a href={mediaUrl(qrCode.qr_image_url)} target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                  <QrCode className="h-4 w-4" />
                  <span>Open QR Code</span>
                </Button>
              </a>
            )}
          </div>
          {message && <p role="status" aria-live="polite" className="text-xs text-emerald-300">{message}</p>}

          {exhibition.short_description && (
            <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-3xl">
              {exhibition.short_description}
            </p>
          )}
        </div>
      </div>

      {qrCode?.qr_image_url && (
        <section className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <img src={mediaUrl(qrCode.qr_image_url)} alt={`QR code for ${exhibition.title}`} className="h-40 w-40 rounded bg-white p-2" />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Exhibition QR Code</h2>
            <p className="text-sm text-[#A1A1AA]">Scan this code to open the exhibition catalogue.</p>
            <p className="font-mono text-xs text-[#71717A]">{qrCode.qr_slug}</p>
          </div>
        </section>
      )}

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
              return <ArtworkCard key={item.id || artwork.id} artwork={artwork} source="exhibition" />
            })}
          </div>
        ) : (
          <EmptyState title="No Linked Artworks" description="No artworks have been added to this exhibition catalogue yet." />
        )}
      </section>

      <div className="flex justify-end border-t border-white/[0.08] pt-4">
        <button
          type="button"
          onClick={() => setReportTarget({ target_exhibition: exhibition.id })}
          className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-xs text-[#94A3B8] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Flag className="h-3.5 w-3.5" /> Report exhibition
        </button>
      </div>
      {reportTarget && <ReportContentModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </div>
  )
}
