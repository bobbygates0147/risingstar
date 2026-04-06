import { useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { isAuthenticated } from './lib/auth'
import { ActivityPage } from './pages/activity-page'
import { AdminPanelPage } from './pages/admin-panel-page'
import { AIBotPage } from './pages/ai-bot-page'
import { LoginPage, SignupPage } from './pages/auth-page'
import { DashboardPage } from './pages/dashboard-page'
import { PlaceholderPage } from './pages/placeholder-page'
import { TaskPlayerPage } from './pages/task-player-page'
import { TasksPage } from './pages/tasks-page'

function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireGuest() {
  return isAuthenticated() ? <Navigate to="/" replace /> : <Outlet />
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
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:taskId" element={<TaskPlayerPage />} />
            <Route
              path="/wallet"
              element={
                <PlaceholderPage
                  title="Wallet"
                  description="Deposit, withdrawal, and transaction history controls are being rebuilt and will return in the next pass."
                />
              }
            />
            <Route path="/activity" element={<ActivityPage />} />
            <Route
              path="/profile"
              element={
                <PlaceholderPage
                  title="Profile"
                  description="Tier settings, payout methods, notifications, and account controls will be built in the next pass."
                />
              }
            />
            <Route path="/ai-bot" element={<AIBotPage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated() ? '/' : '/login'} replace />} />
      </Routes>
    </>
  )
}

export default App
