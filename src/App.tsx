import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { InputPage } from './pages/InputPage'
import { PreviewPage } from './pages/PreviewPage'
import { OrdersPage } from './pages/OrdersPage'
import { MakersPage } from './pages/MakersPage'
import { MakerDetailPage } from './pages/MakerDetailPage'
import { SettingsPage } from './pages/SettingsPage'

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (session.business?.id && session.business?.name) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading, needsOnboarding } = useAuth()
  if (loading) return null
  if (session && !needsOnboarding) return <Navigate to="/dashboard" replace />
  if (session && needsOnboarding) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <SignupPage />
              </PublicOnly>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingGuard>
                <OnboardingPage />
              </OnboardingGuard>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/record" element={<InputPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/makers" element={<MakersPage />} />
            <Route path="/makers/:makerId" element={<MakerDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
