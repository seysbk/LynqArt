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
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')
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
    } catch {
      setMessage('Could not update comment.')
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}/`)
      setComments(comments.filter((item) => item.id !== commentId))
      setMessage('Comment deleted.')
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

      {/* Creation Documentation & Progress Images Section */}
      {images.length > 0 && (
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
        </section>
      )}

      {/* Blended Discussions & Expert Reviews Section */}
      <section className="space-y-6 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-[#F4F4F5]">Discussions &amp; Peer Reviews ({reviews.length + comments.length})</h2>
          </div>
        </div>

        {/* Dedicated Verified Expert Reviews Banner/Feed if Present */}
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
                    <span className="text-sm font-semibold text-[#F4F4F5]">{review.title}</span>
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

          {session.user ? (
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
          )}

          {comments.length ? (
            <div className="space-y-3 max-w-2xl">
              {comments.map((item) => {
                const isOwner = session.user?.id === item.user?.id
                const isExpert = item.user?.is_expert
                const isEditing = editingCommentId === item.id

                return (
                  <div key={item.id} className={`surface-card p-4 space-y-2 text-xs border ${isExpert ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.08]'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F4F4F5]">
                          {item.user?.full_name || item.user?.username || 'Visitor'}
                        </span>
                        {isExpert && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] flex items-center gap-1">
                            <Award className="h-3 w-3 inline" /> Verified Expert Review
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#71717A] text-[10px]">{formatDate(item.created_at)}</span>
                        {isOwner && !isEditing && (
                          <div className="flex items-center gap-1.5 text-[11px] ml-2">
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
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-[#71717A]">No discussion comments posted yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}