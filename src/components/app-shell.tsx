import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  MobileBottomNav,
  NavigationSidebar,
  TopNavbar,
} from './navigation'

type ThemeMode = 'dark' | 'light'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem('rising-star-theme')

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Dashboard',
    description: 'Track balance, daily earnings, task momentum, and upgrade readiness.',
  },
  '/tasks': {
    title: 'Tasks',
    description: 'Manage the live music, art, and ad queue with filters tuned for mobile and desktop.',
  },
  '/wallet': {
    title: 'Wallet',
    description: 'Manage deposits, withdrawals, and your payout history.',
  },
  '/activity': {
    title: 'Activity',
    description: 'Review recent earnings, completed tasks, and withdrawal events.',
  },
  '/profile': {
    title: 'Profile',
    description: 'Update account settings, tiers, notifications, and payment methods.',
  },
}

export function AppShell() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const activePage = pageMeta[location.pathname] ?? pageMeta['/']

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('rising-star-theme', theme)
  }, [theme])

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[rgba(124,58,237,0.18)] blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[rgba(59,130,246,0.14)] blur-3xl" />
        <div className="absolute bottom-24 right-16 h-64 w-64 rounded-full bg-[rgba(167,139,250,0.12)] blur-3xl" />
      </div>

      <NavigationSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={clsx(
          'relative min-h-screen transition-[padding] duration-300 lg:pr-3',
          sidebarCollapsed ? 'lg:pl-[6.75rem]' : 'lg:pl-[17rem]',
        )}
      >
        <div
          className={clsx(
            'fixed top-0 right-0 left-0 z-20 transition-[left,right,top] duration-300 lg:top-2 lg:right-3',
            sidebarCollapsed ? 'lg:left-[6.75rem]' : 'lg:left-[17rem]',
          )}
        >
          <TopNavbar
            description={activePage.description}
            onOpenMobile={() => setMobileOpen(true)}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
            onToggleTheme={() =>
              setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
            }
            sidebarCollapsed={sidebarCollapsed}
            theme={theme}
            title={activePage.title}
          />
        </div>

        <main className="px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-8 lg:pt-[6.85rem]">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
