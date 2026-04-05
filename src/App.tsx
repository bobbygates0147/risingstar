import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { DashboardPage } from './pages/dashboard-page'
import { PlaceholderPage } from './pages/placeholder-page'
import { TasksPage } from './pages/tasks-page'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route
          path="/wallet"
          element={
            <PlaceholderPage
              title="Wallet"
              description="Deposits, withdrawals, and transaction states will live here once the payment flow is wired."
            />
          }
        />
        <Route
          path="/activity"
          element={
            <PlaceholderPage
              title="Activity"
              description="This screen will expand into a full earnings and task history feed after the player flow is added."
            />
          }
        />
        <Route
          path="/profile"
          element={
            <PlaceholderPage
              title="Profile"
              description="Tier settings, payout methods, notifications, and account controls will be built in the next pass."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
