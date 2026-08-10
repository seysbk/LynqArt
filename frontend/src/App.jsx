import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { useSession } from './hooks/useSession'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ArtworkDetailPage } from './pages/public/ArtworkDetailPage'
import { ArtistProfilePage } from './pages/public/ArtistProfilePage'
import { ExhibitionPage } from './pages/public/ExhibitionPage'
import { ExplorePage } from './pages/public/ExplorePage'
import { HomePage } from './pages/public/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

function App() {
  const session = useSession()

  return (
    <Routes>
      <Route element={<AppLayout session={session} />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="artworks/:artworkId" element={<ArtworkDetailPage session={session} />} />
        <Route path="artists/:artistId" element={<ArtistProfilePage />} />
        <Route path="exhibitions/:exhibitionId" element={<ExhibitionPage />} />
        <Route path="login" element={<LoginPage session={session} />} />
        <Route path="register" element={<RegisterPage session={session} />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute session={session}>
              <DashboardPage session={session} />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
