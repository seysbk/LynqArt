import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../../lib/api'
import { mediaUrl } from '../../lib/media'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Heart, QrCode, Share2, Award, MessageSquare } from 'lucide-react'

const list = (data) => data?.results || data || []

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
  const [artwork, setArtwork] = useState(null)
  const [reviews, setReviews] = useState([])
  const [comments, setComments] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [message, setMessage] = useState('')

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
  }, [artworkSlug, session.user])

  const statement = artwork?.current_version_detail?.markdown_statement || artwork?.versions?.[0]?.markdown_statement
  const images = useMemo(
    () => artwork?.images?.slice().sort((a, b) => a.display_order - b.display_order) || [],
    [artwork],
  )

  const submitComment = async (event) => {
    event.preventDefault()
    if (!commentText.trim()) return
    try {
      const { data } = await api.post('/comments/', { artwork: artwork.id, comment: commentText })
      setComments([data, ...comments])
      setCommentText('')
      setMessage('Comment posted.')
    } catch {
      setMessage('Could not post comment.')
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
    } catch {
      setMessage('Could not update bookmark.')
    }
  }

  const shareQr = async () => {
    if (!qrCode) return
    const url = `${window.location.origin}/qr/${qrCode.qr_slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: artwork.title, text: `View ${artwork.title} on LynqArt`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setMessage('QR link copied to clipboard!')
      }
    } catch {
      setMessage('Could not share link.')
    }
  }

  if (loading) return <LoadingState title="Loading Artwork" description="Fetching statement and artwork catalogue..." />
  if (!artwork) return <EmptyState title="Artwork Not Found" description="This artwork link does not exist or is not public." />

  const artistName = artwork.artist?.full_name || artwork.artist?.username || 'Artist'
  const heroImage = mediaUrl(artwork.images?.[0]?.image_url || artwork.banner_image)

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Artwork Section (Section 36 Layout) */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Artwork Image */}
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
                No image available
              </div>
            )}
          </div>

          {/* Secondary Process Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              {images.slice(1).map((img) => (
                <div key={img.id} className="surface-card overflow-hidden aspect-square">
                  <img
                    src={mediaUrl(img.image_url)}
                    alt={img.caption || artwork.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Artwork Metadata & Artist Statement (Section 36 Layout) */}
        <div className="space-y-8 lg:col-span-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {artwork.category_detail?.name || 'Artwork Catalogue'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F4F5]">{artwork.title}</h1>
            <p className="text-base text-[#A1A1AA]">
              By{' '}
              {artwork.artist?.id ? (
                <Link to={`/artists/${artwork.artist.id}`} className="text-[#F4F4F5] hover:text-indigo-400 transition-colors font-medium">
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

            {qrCode?.qr_image_url && (
              <>
                <a href={mediaUrl(qrCode.qr_image_url)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                    <QrCode className="h-4 w-4" />
                    <span>View QR Tag</span>
                  </Button>
                </a>
                <Button variant="secondary" onClick={shareQr} className="!py-1.5 !px-3 text-xs">
                  <Share2 className="h-4 w-4" />
                  <span>Share Link</span>
                </Button>
              </>
            )}
          </div>

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

          {/* Artwork Information */}
          <div className="surface-card p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Artwork Specifications</h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[#71717A]">Medium</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.medium || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Year Created</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.year_created || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Dimensions</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{artwork.dimensions || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-[#71717A]">Published</dt>
                <dd className="text-[#F4F4F5] font-medium mt-0.5">{formatDate(artwork.published_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Expert Reviews Section */}
      <section className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-[#F4F4F5]">Expert &amp; Peer Reviews ({reviews.length})</h2>
        </div>

        {reviews.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <div key={review.id} className="surface-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F4F4F5]">{review.title}</span>
                  <span className="text-xs text-indigo-400 font-semibold">★ {review.rating}/5</span>
                </div>
                <p className="text-xs text-[#A1A1AA]">
                  By {review.reviewer?.full_name || review.reviewer?.username || 'Verified Lecturer'}
                </p>
                <div className="prose prose-invert text-xs text-[#F4F4F5] pt-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.markdown_review}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#71717A]">No peer lecturer reviews posted yet.</p>
        )}
      </section>

      {/* Visitor Discussion Comments */}
      <section className="space-y-4 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-[#F4F4F5]">Visitor Discussion ({comments.length})</h2>
        </div>

        {session.user ? (
          <form onSubmit={submitComment} className="space-y-3 max-w-xl">
            <textarea
              required
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a response..."
              className="w-full rounded-[10px] bg-[#141720] border border-white/[0.09] p-3 text-xs text-[#F4F4F5] outline-none focus:border-indigo-400"
            />
            <Button type="submit" variant="primary" className="!py-1.5 !px-3 text-xs">
              Post Comment
            </Button>
          </form>
        ) : (
          <p className="text-xs text-[#71717A]">
            <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link> to participate in discussions.
          </p>
        )}

        {comments.length ? (
          <div className="space-y-3 max-w-2xl">
            {comments.map((item) => (
              <div key={item.id} className="surface-card p-4 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F4F4F5]">{item.user?.full_name || item.user?.username || 'Visitor'}</span>
                  <span className="text-[#71717A] text-[10px]">{formatDate(item.created_at)}</span>
                </div>
                <p className="text-[#A1A1AA]">{item.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#71717A]">No comments posted yet.</p>
        )}
      </section>
    </div>
  )
}