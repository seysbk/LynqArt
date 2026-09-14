import React, { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'
import { NotFoundPage } from './NotFoundPage'

export function QRLandingPage() {
  const { qrSlug } = useParams()
  const [target, setTarget] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api
      .get('/qr/codes/resolve/', { params: { slug: qrSlug } })
      .then(({ data }) => setTarget(data))
      .catch(() => setFailed(true))
  }, [qrSlug])

  if (failed) {
    return <NotFoundPage />
  }

  if (!target) {
    return (
      <CenteredState
        title="Redirecting Physical QR Tag..."
        description="Resolving digital exhibition catalogue page..."
        icon="qr"
      />
    )
  }

  const path = target.entity_type === 'artwork' ? `/artworks/${target.target_slug}?source=qr` : `/exhibitions/${target.target_slug}`
  return <Navigate to={path} replace />
}
