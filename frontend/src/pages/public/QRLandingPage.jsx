import React, { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { CenteredState } from '../../components/ui/CenteredState'

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
    return (
      <CenteredState
        title="QR Code Resolution Failed"
        description="This physical QR tag code may have expired or been deactivated by the exhibition organizer."
        icon="help"
      />
    )
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

  const path = target.entity_type === 'artwork' ? `/artworks/${target.target_slug}` : `/exhibitions/${target.target_slug}`
  return <Navigate to={path} replace />
}
