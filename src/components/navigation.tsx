import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  mobileLabel: string
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, mobileLabel: 'Home' },
  { label: 'Tasks', href: '/tasks', icon: Headphones, mobileLabel: 'Tasks' },
  { label: 'Wallet', href: '/wallet', icon: Wallet, mobileLabel: 'Wallet' },
  { label: 'Activity', href: '/activity', icon: Activity, mobileLabel: 'Log' },
  { label: 'Profile', href: '/profile', icon: UserRound, mobileLabel: 'Me' },
]

type SidebarContentProps = {
  collapsed: boolean
  onItemSelect?: () => void
}

function BrandMark({ compact }: { compact: boolean }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5',
        compact && 'justify-center lg:justify-start',
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--purple)] via-[var(--glow)] to-[var(--blue)] shadow-[0_12px_30px_rgba(124,58,237,0.35)]">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      {!compact && (
        <div>
          <p className="font-display text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Rising Star
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Promotion and rewards
          </p>
        </div>
      )}
    </div>
  )
}

function SidebarContent({ collapsed, onItemSelect }: SidebarContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={clsx(
          'shrink-0 flex h-20 items-center gap-2.5 border-b border-[var(--border-soft)] px-3',
          collapsed ? 'justify-center' : 'justify-start',
        )}
      >
        <BrandMark compact={collapsed} />
      </div>

      <nav className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1.5">
          {navigationItems.map(({ href, icon: Icon, label }) => (
            <NavLink
              key={href}
              end={href === '/'}
              onClick={onItemSelect}
              to={href}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center rounded-xl border px-2.5 py-2 text-sm transition',
                  collapsed ? 'justify-center gap-0' : 'gap-2.5',
                  isActive
                    ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.14)] text-[var(--text-primary)] shadow-[0_12px_25px_rgba(17,24,39,0.12)]'
                    : 'border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition',
                      isActive
                        ? 'bg-[rgba(167,139,250,0.16)] text-[var(--glow)]'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] group-hover:bg-[var(--surface-hover)] group-hover:text-[var(--text-primary)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {!collapsed && (
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {label}
                    </p>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="shrink-0 px-2.5 pb-3">
        <div
          className={clsx(
            'surface-glow overflow-hidden rounded-2xl p-3.5',
            collapsed && 'px-2.5 py-3',
          )}
          style={{ backgroundImage: 'var(--gradient-sidebar-card)' }}
        >
          <div
            className={clsx(
              'rounded-[18px] border border-[var(--border-soft)] bg-[var(--surface-overlay)] p-3.5',
              collapsed && 'p-3',
            )}
          >
            <p
              className={clsx(
                'text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]',
                collapsed && 'text-center',
              )}
            >
              {collapsed ? 'BOT' : 'AI bot'}
            </p>
            {!collapsed && (
              <>
                <p className="mt-2 font-display text-base font-semibold text-[var(--text-primary)]">
                  Automate your queue
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  Premium automation with periodic validation checkpoints.
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[var(--button-primary-bg)] px-4 text-sm font-semibold text-[var(--button-primary-text)] transition hover:bg-[var(--button-primary-hover)]"
                >
                  Activate Pro
                </button>
              </>
            )}
            {collapsed && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] transition hover:bg-[var(--button-primary-hover)]"
                  aria-label="Activate AI Bot"
                >
                  <Bot className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type NavigationSidebarProps = {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function NavigationSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: NavigationSidebarProps) {
  return (
    <>
      <aside
        className={clsx(
          'sidebar-aura surface-grid fixed inset-y-3 left-3 z-30 hidden overflow-hidden rounded-[28px] rounded-tr-none border border-[var(--border-soft)] bg-[var(--surface-sidebar)] backdrop-blur-xl transition-[width] duration-300 lg:block',
          collapsed ? 'w-[5.75rem]' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      <div
        className={clsx(
          'fixed inset-0 z-40 bg-[var(--overlay-backdrop)] backdrop-blur-sm transition lg:hidden',
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={clsx(
          'sidebar-aura surface-grid fixed top-4 bottom-4 left-4 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-sidebar-mobile)] backdrop-blur-xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
        )}
      >
        <SidebarContent collapsed={false} onItemSelect={onCloseMobile} />
      </aside>
    </>
  )
}

type TopNavbarProps = {
  description: string
  joinedToSidebar?: boolean
  onOpenMobile: () => void
  onToggleCollapse: () => void
  onToggleTheme: () => void
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  title: string
}

export function TopNavbar({
  description,
  joinedToSidebar = false,
  onOpenMobile,
  onToggleCollapse,
  onToggleTheme,
  sidebarCollapsed,
  theme,
  title,
}: TopNavbarProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header
      className={clsx(
        'relative z-50 w-full border-b border-[var(--border-soft)] bg-[var(--header-bg)] backdrop-blur-xl lg:overflow-visible lg:border lg:shadow-[var(--shadow-panel)]',
        joinedToSidebar
          ? 'lg:rounded-r-[28px] lg:rounded-l-none lg:border-l-0'
          : 'lg:rounded-[28px]',
      )}
    >
      <div className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobile}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] lg:inline-flex"
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {title}
            </h1>
            <p className="hidden truncate text-sm text-[var(--text-secondary)] xl:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-2.5 text-right xl:block">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Daily pulse
            </p>
            <p className="mt-1 font-display text-sm font-semibold text-[var(--text-primary)]">
              Queue opens 07:00 WAT
            </p>
          </div>
          <button
            type="button"
            className="hidden h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.26)] transition hover:brightness-110 sm:inline-flex"
          >
            <Bot className="h-4 w-4" />
            Activate Bot
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            aria-label={
              theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              theme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {theme === 'dark' ? (
              <SunMedium className="h-5 w-5 text-amber-400" />
            ) : (
              <MoonStar className="h-5 w-5 text-indigo-500" />
            )}
          </button>
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              aria-label="Open account menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--glow)] to-[var(--blue)] text-sm font-semibold text-white">
                AJ
              </div>
            </button>

            <div
              className={clsx(
                'absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(21rem,calc(100vw-2rem))] origin-top-right rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-popup)] p-3 shadow-[var(--shadow-popup)] backdrop-blur-2xl transition',
                accountOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0',
              )}
            >
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--glow)] to-[var(--blue)] text-base font-semibold text-white">
                    AJ
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-[var(--text-primary)]">
                      Ayo James
                    </p>
                    <p className="truncate text-sm text-[var(--text-secondary)]">
                      ayo.james@risingstar.app
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-overlay)] px-3 py-2.5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Active tier
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                      Tier 2 Earner
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgba(124,58,237,0.16)] px-3 py-1 text-xs font-medium text-[var(--glow)]">
                    Verified
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <Link
                  to="/wallet"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--blue)]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-[var(--text-primary)]">
                      Wallet
                    </span>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Deposits, withdrawals and payout history
                    </span>
                  </span>
                </Link>

                <Link
                  to="/ai-bot"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--glow)]">
                    <Bot className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-[var(--text-primary)]">
                      AI Bot
                    </span>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Automation status and usage controls
                    </span>
                  </span>
                </Link>

                <Link
                  to="/artist"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--blue)]">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-[var(--text-primary)]">
                      Artist Dashboard
                    </span>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Upload music and launch campaigns
                    </span>
                  </span>
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-[var(--warning)]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-[var(--text-primary)]">
                      Admin Panel
                    </span>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      Review users, alerts, and approvals
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false)
                    signOut()
                    navigate('/login', { replace: true })
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-subtle)] text-rose-400">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium text-[var(--text-primary)]">
                      Sign out
                    </span>
                    <span className="block text-xs text-[var(--text-tertiary)]">
                      End this session on this device
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export function MobileBottomNav() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-4 lg:hidden">
      <nav className="pointer-events-auto mx-auto max-w-xl rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-bottomnav)] p-2 shadow-[var(--shadow-popup)] backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-1">
          {navigationItems.map(({ href, icon: Icon, mobileLabel }) => (
            <NavLink
              key={href}
              end={href === '/'}
              to={href}
              className={({ isActive }) =>
                clsx(
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-3xl px-1 py-2 text-[10px] leading-none transition sm:px-2 sm:py-2.5 sm:text-[11px]',
                  isActive
                    ? 'bg-[rgba(124,58,237,0.16)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                )
              }
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="max-w-full truncate">{mobileLabel}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
