import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { shareLink, sharePreviewUrl } from '../../lib/sharing'
import { Button } from '../../components/ui/Button'
import { ArtworkCard, formatAttribution, formatCopyrightHolders } from '../../components/ui/ArtworkCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Heart, QrCode, Share2, Award, MessageSquare, Mail, Flag, Eye } from 'lucide-react'
import { ContactArtistModal } from '../../components/ui/ContactArtistModal'
import { ReportContentModal } from '../../components/ui/ReportContentModal'
import { MarkdownTips } from '../../components/ui/MarkdownTips'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

const list = (data) => data?.results || data || []

const licenseDetails = {
  all_rights_reserved: 'All rights reserved — reuse requires the copyright holder’s permission.',
  cc_by_nc_nd: 'CC BY-NC-ND — sharing with credit is allowed for non-commercial use, but changes are not allowed.',
  cc_by_sa: 'CC BY-SA — reuse and adaptations with credit are allowed when the same licence is used.',
  public_domain: 'Public domain — no exclusive copyright restrictions are claimed.',
}

const setMeta = (selector, attribute, value) => {
  const element = document.querySelector(selector) || document.head.appendChild(Object.assign(document.createElement('meta'), { [attribute]: selector.includes('property=') ? selector.match(/"([^"]+)"/)[1] : selector.match(/"([^"]+)"/)[1] }))
  element.setAttribute(attribute, value || '')
}

const updateSocialMetadata = (artwork) => {
  const description = (artwork.description || `About this work: ${artwork.title}`).slice(0, 200)
  const image = mediaUrl(artwork.banner_image)
  const url = window.location.href
  setMeta('meta[name="description"]', 'name', description)
  setMeta('meta[property="og:title"]', 'property', artwork.title)
  setMeta('meta[property="og:description"]', 'property', description)
  setMeta('meta[property="og:type"]', 'property', 'article')
  setMeta('meta[property="og:url"]', 'property', url)
  setMeta('meta[property="og:image"]', 'property', image)
  setMeta('meta[property="og:image:alt"]', 'property', artwork.title)
  setMeta('meta[name="twitter:card"]', 'name', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name', artwork.title)
  setMeta('meta[name="twitter:description"]', 'name', description)
  setMeta('meta[name="twitter:image"]', 'name', image)
  const icon = document.querySelector('link[rel="apple-touch-icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'apple-touch-icon' }))
  icon.setAttribute('href', image)
}

const formatDate = (value) => {
  if (!value) return 'Date pending'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

export function ArtworkDetailPage({ session }) {
  const { artworkSlug } = useParams()
  const [searchParams] = useSearchParams()
  const [artwork, setArtwork] = useState(null)
  const [reviews, setReviews] = useState([])
  const [comments, setComments] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [replyingCommentId, setReplyingCommentId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewPreview, setReviewPreview] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [message, setMessage] = useState('')
  const [otherArtworks, setOtherArtworks] = useState([])
  const [contactOpen, setContactOpen] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)

  const fetchCommentsAndReviews = useCallback(async () => {
    if (!artwork?.id) return
    try {
      const [reviewsRes, commentsRes, favRes] = await Promise.all([
        api.get('/reviews/', { params: { artwork: artwork.id } }),
        api.get('/comments/', { params: { artwork: artwork.id } }),
        session.user ? api.get('/comments/favorites/') : Promise.resolve({ data: [] }),
      ])
      setReviews(list(reviewsRes.data))
      setComments(list(commentsRes.data).filter((item) => !item.parent_comment))
      if (session.user) setFavorite(list(favRes.data).some((item) => item.artwork === artwork.id))
    } catch {
      // Silently fail on background refetch
    }
  }, [artwork?.id, session.user])

  useEffect(() => {
    let active = true
    api
      .get(`/artworks/${artworkSlug}/`)
      .then(async ({ data }) => {
        const requests = [
          api.get('/reviews/', { params: { artwork: data.id } }),
          api.get('/comments/', { params: { artwork: data.id } }),
          api.get('/qr/codes/', { params: { entity_type: 'artwork', entity_id: data.id } }),
        ]
        if (session.user) requests.push(api.get('/comments/favorites/'))
        const results = await Promise.all(requests)
        if (!active) return
        setArtwork(data)
        document.title = `${data.title} by ${data.artist?.full_name || data.artist?.username || 'Artist'} | LynqArt`
        updateSocialMetadata(data)
        const related = await api.get('/artworks/', { params: { artist_id: data.artist?.id, status: 'published', ordering: '-created_at' } }).catch(() => ({ data: [] }))
        setOtherArtworks(list(related.data).filter((item) => item.id !== data.id).slice(0, 4))
        api.post('/analytics/views/', {
          artwork: data.id,
          source: searchParams.get('source') || 'unknown',
          viewed_from: document.referrer,
        }).catch(() => {})
        setReviews(list(results[0].data))
        setComments(list(results[1].data).filter((item) => !item.parent_comment))
        setQrCode(list(results[2].data)[0] || null)
        if (session.user) setFavorite(list(results[3].data).some((item) => item.artwork === data.id))
        setLoading(false)
      })
      .catch(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [artworkSlug, searchParams, session.user])

  // Refetch comments and reviews when browser regains focus
  useRefetchOnFocus(fetchCommentsAndReviews)

  const statement = artwork?.current_version_detail?.markdown_statement || artwork?.versions?.[0]?.markdown_statement
  const images = useMemo(
    () => artwork?.images?.slice().sort((a, b) => a.display_order - b.display_order) || [],
    [artwork],
  )

  const submitComment = async (event, parentCommentId = null) => {
    if (event) event.preventDefault()
    const content = parentCommentId ? replyText : commentText
    if (!content.trim() || !artwork.allow_comments) return
    try {
      const payload = { artwork: artwork.id, comment: content.trim() }
      if (parentCommentId) payload.parent_comment = parentCommentId
      await api.post('/comments/', payload)
      if (parentCommentId) {
        setReplyText('')
        setReplyingCommentId(null)
        setMessage('Reply posted.')
      } else {
        setCommentText('')
        setMessage('Comment posted.')
      }
      fetchCommentsAndReviews()
    } catch (err) {
      setMessage(err?.response?.data?.detail || 'Could not post comment.')
    }
  }

  const submitExpertReview = async (event) => {
    event.preventDefault()
    if (!reviewTitle.trim() || !reviewText.trim() || !session.user?.is_expert) return
    setSubmittingReview(true)
    try {
      const { data } = await api.post('/reviews/', {
        artwork: artwork.id,
        title: reviewTitle.trim(),
        markdown_review: reviewText.trim(),
        rating: Number(reviewRating),
      })
      setReviews([data, ...reviews])
      setReviewTitle('')
      setReviewText('')
      setReviewRating(0)
      setMessage('Expert review published.')
      // Refetch to ensure fresh data
      fetchCommentsAndReviews()
    } catch {
      setMessage('Could not publish expert review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleEditComment = (commentItem) => {
    setEditingCommentId(commentItem.id)
    setEditingText(commentItem.comment)
  }

  const saveEditedComment = async (commentId) => {
    if (!editingText.trim()) return
    try {
      const { data } = await api.patch(`/comments/${commentId}/`, { comment: editingText })
      setComments(comments.map((item) => (item.id === commentId ? { ...item, comment: data.comment } : item)))
      setEditingCommentId(null)
      setEditingText('')
      setMessage('Comment updated.')
      // Refetch to ensure consistency
      fetchCommentsAndReviews()
    } catch {
      setMessage('Could not update comment.')
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}/`)
      setComments(comments.filter((item) => item.id !== commentId))
      setMessage('Comment deleted.')
      // Refetch to ensure consistency
      fetchCommentsAndReviews()
    } catch {
      setMessage('Could not delete comment.')
    }
  }

  const toggleFavorite = async () => {
    try {
      if (favorite) {
        await api.delete('/comments/favorites/by_artwork/', { data: { artwork_id: artwork.id } })
      } else {
        await api.post('/comments/favorites/by_artwork/', { artwork_id: artwork.id })
      }
      setFavorite(!favorite)
      // Refetch to ensure consistency
      fetchCommentsAndReviews()
    } catch {
      setMessage('Could not update bookmark.')
    }
  }

  const shareArtwork = async () => {
    const url = sharePreviewUrl('artworks', artwork.slug)
    try {
      const result = await shareLink({ title: artwork.title, text: `View ${artwork.title} on LynqArt`, url })
      if (result === 'copied') setMessage('Artwork link copied to clipboard.')
      if (result === 'shared') setMessage('Artwork link ready to share.')
    } catch {
      setMessage('Could not share the artwork link. Please try again.')
    }
  }

  const handleReviewMarkdownInsert = (prefix, suffix, placeholder) => {
    const addition = `${prefix}${placeholder}${suffix}`
    setReviewText((current) => `${current}${addition}`)
  }

  if (loading) return <LoadingState title="Loading Artwork" description="Fetching statement and artwork catalogue..." />
  if (!artwork) return <EmptyState title="Artwork Not Found" description="This artwork link does not exist or is not public." />

  const artistName = artwork.artist?.full_name || artwork.artist?.username || 'Artist'
  const heroImage = mediaUrl(artwork.banner_image || images[0]?.image_url)

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Artwork Section */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Artwork Banner / Main Image */}
        <div className="space-y-4 lg:col-span-6">
          <div className="surface-card overflow-hidden">
            {heroImage ? (
              <img
                src={heroImage}
                alt={artwork.title}
                className="w-full h-auto object-cover max-h-[70vh]"
              />
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center text-xs text-[#71717A]">
                No banner image uploaded
              </div>
            )}
          </div>
        </div>

        {/* Right: Artwork Metadata & Artist Statement (Section 36 Layout) */}
        <div className="space-y-8 lg:col-span-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {artwork.category_detail?.name || 'Artwork Catalogue'}
              </span>
              <span className="text-xs text-[#A1A1AA] bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/[0.08]">
                Published on {formatDate(artwork.published_at)}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F4F5]">{artwork.title}</h1>
            <p className="text-base text-[#A1A1AA]">
              By{' '}
              {artwork.accepted_contributors?.length ? (
                <span className="text-[#F4F4F5] font-medium">{formatAttribution(artwork)}</span>
              ) : artwork.artist?.id ? (
                <Link to={`/artists/${artwork.artist.username || artwork.artist.id}`} className="text-[#F4F4F5] hover:text-indigo-400 transition-colors font-medium">
                  {artistName}
                </Link>
              ) : (
                <span>{artistName}</span>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-b border-white/[0.08] py-4">
            {session.user && (
              <Button variant="secondary" onClick={toggleFavorite} className="!py-1.5 !px-3 text-xs">
                <Heart className={`h-4 w-4 ${favorite ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                <span>{favorite ? 'Bookmarked' : 'Bookmark'}</span>
              </Button>
            )}

            {artwork.availability_status === 'available_for_enquiry' && artwork.artist && (
              <Button variant="secondary" onClick={() => setContactOpen(true)} className="!min-h-11 !py-1.5 !px-3 text-xs"><Mail className="h-4 w-4" /><span>Inquire about this work</span></Button>
            )}

            {qrCode?.qr_image_url && (
              <>
                <a href={mediaUrl(qrCode.qr_image_url)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                    <QrCode className="h-4 w-4" />
                    <span>View QR Tag</span>
                  </Button>
                </a>
              </>
            )}
            <Button variant="secondary" onClick={shareArtwork} className="!py-1.5 !px-3 text-xs">
              <Share2 className="h-4 w-4" />
              <span>Share Link</span>
            </Button>
          </div>
          {message && <p role="status" aria-live="polite" className="text-xs text-emerald-300">{message}</p>}

          {/* Artist Statement Section (Editorial Typography - Section 37) */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Artist Statement</h2>
            {statement ? (
              <div className="reading-width prose prose-invert prose-p:text-[#F4F4F5] prose-p:text-base prose-p:leading-relaxed text-sm sm:text-base text-[#F4F4F5]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{statement}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-[#71717A] italic">No artist statement added yet.</p>
            )}
          </div>

          {artwork.description && <div className="space-y-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">About this work</h2><p className="text-sm leading-relaxed text-[#A1A1AA]">{artwork.description}</p></div>}

          <div className="flex items-center gap-2"><span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">{artwork.availability_status === 'available_for_enquiry' ? 'Available for acquisition / enquiries' : artwork.availability_status === 'not_for_sale' ? 'Not for sale / Private collection' : artwork.availability_status === 'on_loan' ? 'On exhibition loan' : 'Acquired / Sold'}</span></div>

          {/* Artists & Public Attribution Section */}
          {artwork.accepted_contributors?.length > 0 && (
            <div className="surface-card p-5 space-y-3 border-indigo-500/30 bg-indigo-500/5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Artists &amp; Public Attribution</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1">
                  <Link to={`/artists/${artwork.artist?.username || artwork.artist?.id}`} className="font-semibold text-[#F4F4F5] hover:text-indigo-400 transition">
                    {artistName}
                  </Link>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">Lead Artist</span>
                </div>
                {artwork.accepted_contributors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-t border-white/[0.06] pt-1.5">
                    <Link to={`/artists/${c.user?.username || c.user?.id}`} className="font-medium text-[#F4F4F5] hover:text-indigo-400 transition">
                      {c.user?.full_name || c.user?.username}
                    </Link>
                    <span className="text-[#A1A1AA] text-[11px] font-medium">{c.contribution_role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artwork Information */}
          <div className="surface-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Artwork Specifications</h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[#71717A]">Medium</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.medium || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Date / Year Completed</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.year_created || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Dimensions</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.dimensions || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Published On</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{formatDate(artwork.published_at)}</dd>
              </div>
            </dl>
            <div className="border-t border-white/[0.06] pt-3 space-y-2 text-xs">
              <p className="text-[#A1A1AA]">Copyright holder(s): <span className="text-[#F4F4F5] font-medium">{formatCopyrightHolders(artwork)}</span></p>
              {artwork.license_type && <p className="text-[#A1A1AA]">Licence: <span className="text-[#F4F4F5]">{licenseDetails[artwork.license_type] || artwork.license_type.replaceAll('_', ' ')}</span></p>}
              {artwork.provenance_notes && <div className="space-y-1"><p className="text-[#A1A1AA]">Provenance / ownership history</p><p className="text-[#F4F4F5] leading-relaxed">{artwork.provenance_notes}</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Creation Documentation & Progress Images Section */}
      {(images.length > 0 || artwork.process_video_url) && (
        <section className="space-y-4 pt-6 border-t border-white/[0.08]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Creation Documentation</span>
          <h2 className="text-xl font-bold text-[#F4F4F5]">Progress Images &amp; Work-In-Progress ({images.length})</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, idx) => (
              <div key={img.id} className="surface-card overflow-hidden group space-y-3 p-3.5">
                <div className="aspect-[4/3] overflow-hidden rounded-[8px] bg-[#0D0F14]">
                  <img
                    src={mediaUrl(img.image_url)}
                    alt={img.caption || `Progress step ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-indigo-400 text-[11px] uppercase tracking-wider">Progress Stage {idx + 1}</span>
                  {img.caption ? (
                    <p className="text-[#F4F4F5] text-xs leading-relaxed">{img.caption}</p>
                  ) : (
                    <p className="text-[#71717A] text-xs italic">No description provided</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {artwork.process_video_url && <div className="surface-card max-w-2xl overflow-hidden p-3.5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">Process video</p><video controls className="max-h-[480px] w-full rounded-[8px] bg-black" src={mediaUrl(artwork.process_video_url)} /></div>}
        </section>
      )}

      {otherArtworks.length > 0 && <section className="space-y-5 border-t border-white/[0.08] pt-8"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#F4F4F5]">More from this artist</h2><Link to={`/artists/${artwork.artist?.username || artwork.artist?.id}`} className="text-xs text-indigo-400 hover:underline">View artist profile</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{otherArtworks.map((item) => <ArtworkCard key={item.id} artwork={item} source="related_artwork" />)}</div></section>}

      {/* Dedicated Expert Reviews and Community Discussions */}
      <section className="space-y-6 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-[#F4F4F5]">Expert Reviews &amp; Discussions</h2>
          </div>
        </div>

        {session.user?.is_expert && (
          <form onSubmit={submitExpertReview} className="surface-card max-w-2xl space-y-3 border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Write an Expert Review</h3>
              <p className="mt-1 text-[11px] text-[#A1A1AA]">This critique is stored separately from visitor comments and displayed as an expert review.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setReviewPreview(!reviewPreview)} className="!py-1.5 !px-3 text-xs">
                <Eye className="h-4 w-4" />
                <span>{reviewPreview ? 'Editor' : 'Preview'}</span>
              </Button>
            </div>
            <input
              required
              value={reviewTitle}
              onChange={(event) => setReviewTitle(event.target.value)}
              placeholder="Review title"
              className="w-full rounded-[10px] bg-[#141720] border border-white/[0.09] p-3 text-xs text-[#F4F4F5] outline-none focus:border-amber-400"
            />
            {!reviewPreview && <MarkdownTips onInsert={handleReviewMarkdownInsert} value={reviewText} />}
            {reviewPreview ? (
              <div className="surface-card min-h-[120px] p-4 prose prose-invert max-w-none text-xs text-[#F4F4F5]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reviewText || '*No review written.*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                required
                rows={4}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Write your academic or lecturer critique in Markdown..."
                className="w-full rounded-[10px] bg-[#141720] border border-white/[0.09] p-3 text-xs text-[#F4F4F5] outline-none focus:border-amber-400"
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                Rating
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(event.target.value)}
                  className="rounded-[8px] bg-[#141720] border border-white/[0.09] px-2 py-1.5 text-xs text-[#F4F4F5] outline-none focus:border-amber-400"
                >
                  {[0, 1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                </select>
              </label>
              <Button type="submit" variant="primary" disabled={submittingReview} className="!py-1.5 !px-3 text-xs bg-amber-600 hover:bg-amber-500">
                {submittingReview ? 'Publishing...' : 'Publish Expert Review'}
              </Button>
            </div>
          </form>
        )}

        {/* Dedicated Expert Review Feed */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Academic &amp; Lecturer Reviews ({reviews.length})</span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="surface-card p-5 space-y-2 border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-sm font-semibold text-[#F4F4F5]">{review.title}</span>
                      <button
                        type="button"
                        onClick={() => setReportTarget({ target_expert_review: review.id })}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-[#94A3B8] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        title="Report expert review"
                        aria-label="Report expert review"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-amber-400 font-bold">★ {review.rating}/5</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                    <span>By {review.reviewer?.full_name || review.reviewer?.username || 'Verified Lecturer'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[9px] inline-flex items-center gap-1">
                      <Award className="h-2.5 w-2.5" /> Verified Expert
                    </span>
                  </p>
                  <div className="prose prose-invert text-xs text-[#F4F4F5] pt-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.markdown_review}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visitor Discussions */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Community Feedback &amp; Visitor Responses</h3>

          {artwork.allow_comments ? session.user ? (
            <form onSubmit={submitComment} className="space-y-3 max-w-xl">
              <textarea
                required
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a response or question..."
                className="w-full rounded-[10px] bg-[#141720] border border-white/[0.09] p-3 text-xs text-[#F4F4F5] outline-none focus:border-indigo-400"
              />
              <Button type="submit" variant="primary" className="!py-1.5 !px-3 text-xs">
                Post Response
              </Button>
            </form>
          ) : (
            <p className="text-xs text-[#71717A]">
              <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link> to participate in discussions.
            </p>
          ) : (
            <p className="rounded-[9px] border border-white/[0.06] bg-[#0D0F14] p-3 text-xs text-[#A1A1AA]">Comments on this artwork have been limited.</p>
          )}

          {comments.length ? (
            <div className="space-y-3 max-w-2xl">
              {comments.map((item) => {
                const isOwner = session.user?.id === item.user?.id
                const isEditing = editingCommentId === item.id
                const canReply = session.user && (
                  artwork.artist?.id === session.user.id ||
                  artwork.accepted_contributors?.some(c => c.user?.id === session.user.id) ||
                  session.user.is_staff ||
                  session.user.is_superuser
                )
                const isReplying = replyingCommentId === item.id

                return (
                  <div key={item.id} className="surface-card p-4 space-y-2 text-xs border border-white/[0.08]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F4F4F5]">
                          {item.user?.full_name || item.user?.username || 'Visitor'}
                        </span>
                        {item.user?.id === artwork.artist?.id && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px]">Lead Artist</span>
                        )}
                        {artwork.accepted_contributors?.some(c => c.user?.id === item.user?.id) && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px]">Collaborator</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#71717A] text-[10px]">{formatDate(item.created_at)}</span>
                        <button
                          type="button"
                          onClick={() => setReportTarget({ target_comment: item.id })}
                          className="flex h-11 w-11 items-center justify-center rounded text-[#94A3B8] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          title="Report comment"
                          aria-label="Report comment"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                        {canReply && !isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingCommentId(isReplying ? null : item.id)
                              setReplyText('')
                            }}
                            className="text-indigo-400 hover:underline font-medium text-[11px]"
                          >
                            Reply
                          </button>
                        )}
                        {isOwner && !isEditing && (
                          <div className="flex items-center gap-1.5 text-[11px] ml-1">
                            <button
                              type="button"
                              onClick={() => handleEditComment(item)}
                              className="text-indigo-400 hover:underline font-medium"
                            >
                              Edit
                            </button>
                            <span className="text-[#71717A]">·</span>
                            <button
                              type="button"
                              onClick={() => deleteComment(item.id)}
                              className="text-red-400 hover:underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full rounded-[8px] bg-[#0D0F14] border border-white/[0.12] p-2 text-xs text-[#F4F4F5] outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingCommentId(null)}
                            className="!py-1 !px-2.5 text-[11px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => saveEditedComment(item.id)}
                            className="!py-1 !px-2.5 text-[11px]"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#A1A1AA] leading-relaxed">{item.comment}</p>
                    )}

                    {/* Reply Form for Lead Artist or Collaborator */}
                    {isReplying && (
                      <form onSubmit={(e) => submitComment(e, item.id)} className="space-y-2 pt-2 border-t border-white/[0.06]">
                        <textarea
                          required
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply as an artist/collaborator..."
                          className="w-full rounded-[8px] bg-[#0D0F14] border border-white/[0.12] p-2 text-xs text-[#F4F4F5] outline-none focus:border-indigo-400"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setReplyingCommentId(null)}
                            className="!py-1 !px-2.5 text-[11px]"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            className="!py-1 !px-2.5 text-[11px]"
                          >
                            Post Reply
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Nested Replies */}
                    {item.replies?.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-indigo-500/30 mt-2">
                        {item.replies.map((reply) => (
                          <div key={reply.id} className="space-y-1 bg-white/[0.02] p-2.5 rounded-[8px]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#F4F4F5]">
                                  {reply.user?.full_name || reply.user?.username || 'Artist'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-bold text-[8px]">Artist Response</span>
                              </div>
                              <span className="text-[#71717A] text-[9px]">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="text-[#A1A1AA] leading-relaxed">{reply.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-[#71717A]">No discussion comments posted yet.</p>
          )}
        </div>
      </section>
      <div className="flex justify-end border-t border-white/[0.08] pt-4">
        <button
          type="button"
          onClick={() => setReportTarget({ target_artwork: artwork.id })}
          className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-xs text-[#94A3B8] hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Flag className="h-3.5 w-3.5" /> Report artwork
        </button>
      </div>
      {contactOpen && <ContactArtistModal artist={artwork.artist} artwork={artwork} onClose={() => setContactOpen(false)} />}
      {reportTarget && <ReportContentModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </div>
  )
}
