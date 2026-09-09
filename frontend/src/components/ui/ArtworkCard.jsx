import React from 'react'
import { Link } from 'react-router-dom'
import { mediaUrl } from '../../lib/media'

export function formatAttribution(artwork) {
  if (!artwork) return 'Artist'
  const leadName = artwork.artist?.full_name || artwork.artist?.username || 'Artist'
  const accepted = artwork.accepted_contributors || []
  if (!accepted.length) {
    return leadName
  }
  const contributorNames = accepted.map((c) => c.user?.full_name || c.user?.username).filter(Boolean)
  if (contributorNames.length === 1) {
    return `${leadName} and ${contributorNames[0]}`
  }
  if (contributorNames.length === 2) {
    return `${leadName}, ${contributorNames[0]}, and ${contributorNames[1]}`
  }
  return `${leadName} and ${contributorNames.length} collaborators`
}

export function formatCopyrightHolders(artwork) {
  if (!artwork) return 'Not specified'
  if (artwork.copyright_holder && artwork.copyright_holder.trim()) {
    return artwork.copyright_holder
  }
  const leadName = artwork.artist?.full_name || artwork.artist?.username || 'Lead Artist'
  const accepted = artwork.accepted_contributors || []
  if (!accepted.length) {
    return leadName
  }
  const contributorNames = accepted.map((c) => c.user?.full_name || c.user?.username).filter(Boolean)
  return [leadName, ...contributorNames].join(', ')
}

export function ArtworkCard({ artwork, source = 'unknown' }) {
  if (!artwork) return null

  const imageUrl = mediaUrl(artwork.images?.[0]?.image_url || artwork.banner_image)
  const attribution = formatAttribution(artwork)
  const isCollaborative = Boolean(artwork.accepted_contributors?.length)

  return (
    <Link
      to={`/artworks/${artwork.slug}${source !== 'unknown' ? `?source=${source}` : ''}`}
      className="group block overflow-hidden rounded-[14px] bg-[#141720] border border-white/[0.09] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]"
    >
      {/* Artwork Image Dominates */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D0F14]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#71717A]">
            No image available
          </div>
        )}
        {isCollaborative && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-indigo-600/90 text-white text-[10px] font-bold shadow">
            Collaborative
          </span>
        )}
      </div>

      {/* Artwork Metadata */}
      <div className="p-4 space-y-1">
        <h3 className="text-base font-semibold text-[#F4F4F5] truncate group-hover:text-indigo-400 transition-colors">
          {artwork.title}
        </h3>
        <p className="text-xs text-[#A1A1AA] truncate">
          By {attribution}
        </p>
        <p className="text-xs text-[#71717A] truncate pt-0.5">
          {artwork.medium || 'Artwork'} {artwork.year_created ? `· ${artwork.year_created}` : ''}
        </p>
      </div>
    </Link>
  )
}
