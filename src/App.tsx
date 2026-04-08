import { useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { GlobalToast } from './components/global-toast'
import { GlobalRouteLoader } from './components/global-route-loader'
import { isAdmin, isAuthenticated } from './lib/auth'
import { ActivityPage } from './pages/activity-page'
import { AdminPanelPage } from './pages/admin-panel-page'
import { AIBotPage } from './pages/ai-bot-page'
import { LoginPage, SignupPage, SignupPaymentPage } from './pages/auth-page'
import { DashboardPage } from './pages/dashboard-page'
import { ProfilePage } from './pages/profile-page'
import { TaskPlayerPage } from './pages/task-player-page'
import { TasksPage } from './pages/tasks-page'
import { WalletPage } from './pages/wallet-page'

function getDefaultAuthenticatedRoute() {
  return isAdmin() ? '/admin' : '/'
}

function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireAdmin() {
  return isAdmin() ? <Outlet /> : <Navigate to="/" replace />
}

function RequireGuest() {
  return isAuthenticated() ? (
    <Navigate to={getDefaultAuthenticatedRoute()} replace />
  ) : (
    <Outlet />
  )
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <ScrollToTopOnRouteChange />
      <GlobalRouteLoader />
      <GlobalToast />
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/payment" element={<SignupPaymentPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskId" element={<TaskPlayerPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ai-bot" element={<AIBotPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminPanelPage />} />
            </Route>
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated() ? getDefaultAuthenticatedRoute() : '/login'}
              replace
            />
          }
        />
      </Routes>
    </>
  )
}

export default App
