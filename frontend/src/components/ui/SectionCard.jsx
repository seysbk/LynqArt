import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icons'

export function SectionCard({ title, meta, children, href, image, imageAlt, badge, badgeColor = 'indigo', footer }) {
  const isExternal = href?.startsWith('http')

  const cardMarkup = (
    <article className="fm-card flex flex-col h-full overflow-hidden group">
      {image && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950/80 border-b border-slate-800/80">
          <img
            src={image}
            alt={imageAlt || title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {badge && (
            <div className="absolute top-3 right-3 z-10">
              <span className={`fm-badge fm-badge-${badgeColor} backdrop-blur-md shadow-lg`}>
                {badge}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {!image && badge && (
          <div className="mb-2">
            <span className={`fm-badge fm-badge-${badgeColor}`}>
              {badge}
            </span>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between gap-2">
            <span className="line-clamp-1">{title}</span>
            {href && (
              <Icon
                name={isExternal ? 'externalLink' : 'arrowRight'}
                className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-0.5"
              />
            )}
          </h3>

          {meta && <p className="mt-1.5 text-xs font-medium text-slate-400 line-clamp-1">{meta}</p>}

          {children && <div className="mt-3 text-sm text-slate-300">{children}</div>}
        </div>

        {footer && <div className="mt-4 pt-3 border-t border-slate-800/80">{footer}</div>}
      </div>
    </article>
  )

  if (!href) return cardMarkup

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {cardMarkup}
      </a>
    )
  }

  return (
    <Link to={href} className="block h-full">
      {cardMarkup}
    </Link>
  )
}