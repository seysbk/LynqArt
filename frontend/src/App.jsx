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
import { ProfilePage } from './pages/public/ProfilePage'
import { ArtworkManagerPage } from './pages/dashboard/ArtworkManagerPage'
import { ExhibitionManagerPage } from './pages/dashboard/ExhibitionManagerPage'
import { QRLandingPage } from './pages/public/QRLandingPage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { TermsPage, PrivacyPage } from './pages/public/LegalPages'

function App() {
  const session = useSession()

  return (
    <Routes>
      <Route element={<AppLayout session={session} />}>
        <Route index element={<HomePage session={session} />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="artworks/:artworkSlug" element={<ArtworkDetailPage session={session} />} />
        <Route path="artists/:artistId" element={<ArtistProfilePage />} />
        <Route path="exhibitions/:exhibitionSlug" element={<ExhibitionPage />} />
        <Route path="qr/:qrSlug" element={<QRLandingPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
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
        <Route
          path="profile"
          element={
            <ProtectedRoute session={session}>
              <ProfilePage session={session} />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route element={<AppLayout session={session} />}>
        <Route path="dashboard/artworks/new" element={<ProtectedRoute session={session}><ArtworkManagerPage /></ProtectedRoute>} />
        <Route path="dashboard/artworks/:artworkSlug/edit" element={<ProtectedRoute session={session}><ArtworkManagerPage /></ProtectedRoute>} />
        <Route path="dashboard/exhibitions/new" element={<ProtectedRoute session={session}><ExhibitionManagerPage /></ProtectedRoute>} />
        <Route path="dashboard/exhibitions/:exhibitionSlug/edit" element={<ProtectedRoute session={session}><ExhibitionManagerPage /></ProtectedRoute>} />
      </Route>
      <Route element={<AppLayout session={session} />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
