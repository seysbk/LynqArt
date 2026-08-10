import { Navigate } from 'react-router-dom'
import { CenteredState } from '../ui/CenteredState'

export function ProtectedRoute({ session, children }) {
  if (session.loading) {
    return <CenteredState title="Loading session" description="Restoring your account..." />
  }

  if (!session.user) {
    return <Navigate to="/login" replace />
  }

  return children
}
