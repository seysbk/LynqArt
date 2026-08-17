import React from 'react'
import { Link } from 'react-router-dom'
import { mediaUrl } from '../../lib/media'

const formatDate = (value) => {
  if (!value) return 'Pending'
  try {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return String(value)
  }
}

export function ExhibitionCard({ exhibition, featured = false }) {
  if (!exhibition) return null

  const bannerUrl = mediaUrl(exhibition.banner_image)

  return (
    <Link
      to={`/exhibitions/${exhibition.slug}`}
      className={`group block overflow-hidden rounded-[14px] bg-[#141720] border border-white/[0.09] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] ${
        featured ? 'h-full flex flex-col' : ''
      }`}
    >
      {/* Exhibition Banner Image */}
      <div className={`relative w-full overflow-hidden bg-[#0D0F14] ${featured ? 'aspect-[16/9] lg:aspect-[16/10]' : 'aspect-[16/9]'}`}>
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={exhibition.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#71717A]">
            Exhibition Banner
          </div>
        )}
      </div>

      {/* Editorial Content */}
      <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              {exhibition.is_featured ? 'Featured Exhibition' : 'Catalogue'}
            </span>
          </div>
          <h3 className={`font-semibold text-[#F4F4F5] group-hover:text-indigo-400 transition-colors ${featured ? 'text-xl sm:text-2xl' : 'text-base'}`}>
            {exhibition.title}
          </h3>
          <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
            {exhibition.short_description || exhibition.markdown_description || 'Browse exhibition catalogue.'}
          </p>
        </div>

        <div className="pt-3 border-t border-white/[0.06] text-xs text-[#71717A] flex items-center justify-between">
          <span>{exhibition.location || 'Gallery Location'}</span>
          <span>{formatDate(exhibition.start_date)}</span>
        </div>
      </div>
    </Link>
  )
}
