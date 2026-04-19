import clsx from 'clsx'
import {
  Clock3,
  Filter,
  Heart,
  Palette,
  Play,
  Radio,
  Send,
  Sparkles,
  Copy,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PaginationControls } from '../components/pagination-controls'
import { TaskCoverImage } from '../components/task-cover-image'
import { type TaskType } from '../data/platform-data'
import { useCurrencyConverter } from '../hooks/use-currency-converter'
import { useRewardTasks } from '../hooks/use-reward-tasks'
import {
  getAuthenticatedUser,
  getAuthorizedHeaders,
  refreshAuthenticatedUser,
  fetchSignupConfig,
} from '../lib/auth'
import {
  getAIBotLocalState,
  isAIBotAutomationActiveForUser,
} from '../lib/ai-bot-state'
import { formatUsd } from '../lib/format'
import { getNextQueuedTask, getProjectedReward } from '../lib/task-queue'

type TaskFilter = 'All' | TaskType | 'Completed'
type TaskPack = {
  id: string
  label: string
  tasks: number
  priceUsd: number
}

type PackCryptoNetwork = 'USDT-TRC20' | 'USDT-ERC20' | 'USDT-BEP20' | 'BTC' | 'ETH' | 'SOL'
type PackHistoryEntry = {
  id: string
  packLabel: string
  tasks: number
  priceUsd: number
  status: string
  requestedAt: string | null
  processedAt: string | null
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const TASK_PACK_ENDPOINT = `${API_BASE_URL}/api/tasks/purchase-pack`
const TASK_PACKS_ENDPOINT = `${API_BASE_URL}/api/tasks/packs`
const TASK_PACK_HISTORY_ENDPOINT = `${API_BASE_URL}/api/tasks/packs/history`
const WALLET_UPDATED_EVENT = 'rising-star:wallet-updated'
const DEFAULT_TASK_PACK_SIZES = [5, 10, 25, 50, 75, 100, 125]
const TASK_PACK_PRICE_PER_TASK_USD = 0.4
const DEFAULT_TASK_PACKS: TaskPack[] = DEFAULT_TASK_PACK_SIZES.map((tasks) => ({
  id: `pack-${tasks}`,
  label: `${tasks} tasks`,
  tasks,
  priceUsd: Number((tasks * TASK_PACK_PRICE_PER_TASK_USD).toFixed(2)),
}))
const SUPPORTED_PROOF_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['application/pdf', 'pdf'],
])

export function TasksPage() {
  const PAGE_SIZE = 8
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('All')
  const [taskPage, setTaskPage] = useState(1)
  const [aiPulseNowMs, setAiPulseNowMs] = useState(() => Date.now())
  const { tasks: rewardTasks, isLoading } = useRewardTasks()
  const currentUser = getAuthenticatedUser()
  const currencyConverter = useCurrencyConverter(currentUser?.countryCode)
  const [taskCredits, setTaskCredits] = useState(
    Number(currentUser?.taskCredits || 0),
  )
  const [isPackModalOpen, setIsPackModalOpen] = useState(false)
  const [taskPacks, setTaskPacks] = useState<TaskPack[]>(DEFAULT_TASK_PACKS)
  const [selectedPackId, setSelectedPackId] = useState<string>(DEFAULT_TASK_PACKS[0]?.id || '')
  const [packTxHash, setPackTxHash] = useState('')
  const [packProofFile, setPackProofFile] = useState<File | null>(null)
  const [packCryptoNetwork, setPackCryptoNetwork] = useState<PackCryptoNetwork>('USDT-TRC20')
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [qrLoadError, setQrLoadError] = useState(false)
  const [packHistory, setPackHistory] = useState<PackHistoryEntry[]>([])
  const [packHistoryLoading, setPackHistoryLoading] = useState(true)
  const [cryptoInstructions, setCryptoInstructions] = useState(() => ({
    btcAddress: '',
    ethAddress: '',
    usdtTrc20Address: '',
    usdtErc20Address: '',
    usdtBep20Address: '',
    solAddress: '',
  }))
  const [purchaseBusy, setPurchaseBusy] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const selectedPack = taskPacks.find((item) => item.id === selectedPackId) ?? taskPacks[0]
  const packAmountUsd = selectedPack ? selectedPack.priceUsd : 0
  const packAmountLocal = currencyConverter.formatDualFromUsd(packAmountUsd)
  const selectedWalletAddress =
    (packCryptoNetwork === 'USDT-TRC20'
      ? cryptoInstructions.usdtTrc20Address
      : packCryptoNetwork === 'USDT-ERC20'
        ? cryptoInstructions.usdtErc20Address
        : packCryptoNetwork === 'USDT-BEP20'
          ? cryptoInstructions.usdtBep20Address
          : packCryptoNetwork === 'BTC'
            ? cryptoInstructions.btcAddress
            : packCryptoNetwork === 'ETH'
              ? cryptoInstructions.ethAddress
              : cryptoInstructions.solAddress) || ''
  const walletQrUrl = useMemo(() => {
    if (!selectedWalletAddress) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
      selectedWalletAddress,
    )}`
  }, [selectedWalletAddress])
  const aiBotLocalState = useMemo(
    () => getAIBotLocalState(new Date(aiPulseNowMs)),
    [aiPulseNowMs, currentUser?.email, currentUser?.id],
  )
  const aiBotAutomating = useMemo(
    () => isAIBotAutomationActiveForUser(currentUser, new Date(aiPulseNowMs)),
    [aiPulseNowMs, currentUser],
  )
  const aiBotPurchased =
    Boolean(currentUser?.aiBotEnabled) || Boolean(aiBotLocalState.activatedAt)
  const aiBotSummary = aiBotAutomating
    ? 'Auto mode is active and processing unlocked tasks.'
    : aiBotPurchased && aiBotLocalState.checkpointRequired
      ? 'Checkpoint required. Complete validation to resume automation.'
      : aiBotPurchased
        ? 'Automation enabled with manual checkpoints.'
        : 'Available with manual checkpoints'
  const aiBotActionLabel = aiBotAutomating
    ? 'Manage AI Bot'
    : aiBotPurchased
      ? 'Resume AI Bot'
      : 'Open AI Bot'

  const taskTypeOrder: TaskType[] = ['Music', 'Art', 'Social', 'Ads']
  const visibleTaskTypes = taskTypeOrder.filter((type) =>
    rewardTasks.some((task) => task.type === type),
  )
  const taskFilters: TaskFilter[] = ['All', ...visibleTaskTypes, 'Completed']
  const selectedFilter = taskFilters.includes(activeFilter) ? activeFilter : 'All'

  const filteredTasks = useMemo(() => {
    return rewardTasks.filter((task) => {
      if (selectedFilter === 'All') {
        return true
      }

      if (selectedFilter === 'Completed') {
        return task.status === 'completed'
      }

      return task.type === selectedFilter
    })
  }, [rewardTasks, selectedFilter])

  const taskPageCount = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))

  useEffect(() => {
    setTaskPage(1)
  }, [selectedFilter])

  useEffect(() => {
    setTaskPage((current) => Math.min(current, taskPageCount))
  }, [taskPageCount])

  useEffect(() => {
    const pulseTimer = window.setInterval(() => {
      setAiPulseNowMs(Date.now())
    }, 30_000)

    return () => {
      window.clearInterval(pulseTimer)
    }
  }, [])

  const loadPackHistory = useCallback(async () => {
    try {
      setPackHistoryLoading(true)
      const response = await fetch(
        `${TASK_PACK_HISTORY_ENDPOINT}?status=Completed&limit=12`,
        {
          headers: {
            ...getAuthorizedHeaders(),
          },
        },
      )

      if (!response.ok) {
        throw new Error('Unable to load pack history')
      }

      const data = (await response.json()) as { history?: PackHistoryEntry[] }
      if (!Array.isArray(data.history)) {
        return
      }

      const normalized = data.history.filter(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.packLabel === 'string' &&
          typeof entry.tasks === 'number' &&
          typeof entry.priceUsd === 'number',
      )

      setPackHistory(normalized)
    } catch {
      setPackHistory([])
    } finally {
      setPackHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPackHistory()
  }, [loadPackHistory])

  function resolveProofMime(file: File) {
    const rawType = file.type?.toLowerCase() || ''
    if (SUPPORTED_PROOF_MIME_TYPES.has(rawType)) {
      return rawType
    }

    const name = file.name?.toLowerCase() || ''
    if (name.endsWith('.pdf')) return 'application/pdf'
    if (name.endsWith('.png')) return 'image/png'
    if (name.endsWith('.webp')) return 'image/webp'
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'

    return ''
  }

  function formatHistoryDate(value: string | null) {
    if (!value) {
      return '—'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  async function readFileAsDataUrl(file: File, mimeType: string) {
    if (!mimeType) {
      throw new Error('Proof of payment must be a valid image or PDF')
    }

    if (file.type && file.type.toLowerCase() === mimeType) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(typeof reader.result === 'string' ? reader.result : '')
        }
        reader.onerror = () => reject(new Error('Unable to read the uploaded proof file.'))
        reader.readAsDataURL(file)
      })
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index])
    }
    const base64 = btoa(binary)
    return `data:${mimeType};base64,${base64}`
  }

  useEffect(() => {
    const onStorage = () => {
      const nextCredits = Number(getAuthenticatedUser()?.taskCredits || 0)
      setTaskCredits(nextCredits)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(WALLET_UPDATED_EVENT, onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(WALLET_UPDATED_EVENT, onStorage)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadWalletInstructions() {
      const config = await fetchSignupConfig()
      const crypto = config.paymentInstructions?.crypto

      if (!crypto || !isMounted) {
        return
      }

      setCryptoInstructions({
        btcAddress: crypto.btcAddress,
        ethAddress: crypto.ethAddress,
        usdtTrc20Address: crypto.usdtTrc20Address,
        usdtErc20Address: crypto.usdtErc20Address,
        usdtBep20Address: crypto.usdtBep20Address,
        solAddress: crypto.solAddress,
      })
    }

    void loadWalletInstructions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadTaskPacks() {
      try {
        const response = await fetch(TASK_PACKS_ENDPOINT, {
          headers: {
            ...getAuthorizedHeaders(),
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load task packs')
        }

        const data = (await response.json()) as { packs?: TaskPack[] }
        if (!Array.isArray(data.packs) || data.packs.length === 0) {
          return
        }

        const normalized = data.packs.filter(
          (pack) =>
            pack &&
            typeof pack.id === 'string' &&
            typeof pack.label === 'string' &&
            typeof pack.tasks === 'number' &&
            typeof pack.priceUsd === 'number',
        )

        if (!isMounted || normalized.length === 0) {
          return
        }

        setTaskPacks(normalized)
        if (!normalized.some((pack) => pack.id === selectedPackId)) {
          setSelectedPackId(normalized[0]?.id || '')
        }
      } catch {
        // keep defaults
      }
    }

    void loadTaskPacks()

    return () => {
      isMounted = false
    }
  }, [selectedPackId])

  async function handlePurchasePack() {
    setPurchaseError('')
    setPurchaseMessage('')
    setPurchaseBusy(true)

    try {
      const pack = taskPacks.find((item) => item.id === selectedPackId)
      if (!pack) {
        throw new Error('Select a valid task pack.')
      }

      if (packTxHash.trim().length < 8) {
        throw new Error('Enter a valid transaction reference.')
      }

      let paymentProofDataUrl: string | undefined
      if (packProofFile) {
        const mimeType = resolveProofMime(packProofFile)
        paymentProofDataUrl = await readFileAsDataUrl(packProofFile, mimeType)
      }

      const response = await fetch(TASK_PACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          packId: pack.id,
          paymentMethod: 'crypto',
          paymentTxHash: packTxHash.trim(),
          paymentNetwork: packCryptoNetwork,
          paymentProofDataUrl,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
        taskCredits?: number
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to purchase task pack')
      }

      if (typeof payload.taskCredits === 'number') {
        setTaskCredits(payload.taskCredits)
      } else {
        const refreshed = await refreshAuthenticatedUser()
        setTaskCredits(Number(refreshed?.taskCredits || 0))
      }

      window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT))
      setPurchaseMessage(payload?.message || 'Task pack purchased')
      setIsPackModalOpen(false)
      setPackTxHash('')
      setPackProofFile(null)
      await loadPackHistory()
    } catch (error) {
      setPurchaseError(
        error instanceof Error ? error.message : 'Unable to purchase task pack',
      )
    } finally {
      setPurchaseBusy(false)
    }
  }

  async function handleCopyWalletAddress(address: string) {
    if (!address) {
      return
    }

    try {
      await navigator.clipboard.writeText(address)
      setCopiedWallet(true)
      window.setTimeout(() => setCopiedWallet(false), 1500)
    } catch {
      setCopiedWallet(false)
    }
  }

  const paginatedTasks = useMemo(() => {
    const startIndex = (taskPage - 1) * PAGE_SIZE
    return filteredTasks.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredTasks, taskPage])

  const completedCount = rewardTasks.filter(
    (task) => task.status === 'completed',
  ).length

  const liveCount = rewardTasks.filter(
    (task) => task.status !== 'completed' && !task.isTimeLocked,
  ).length

  const queuedLaterCount = rewardTasks.filter(
    (task) => task.status !== 'completed' && task.isTimeLocked,
  ).length

  const projectedReward = getProjectedReward(rewardTasks)
  const projectedRewardLocal = currencyConverter.formatDualFromUsd(projectedReward)
  const nextQueuedTask = useMemo(() => getNextQueuedTask(rewardTasks), [rewardTasks])
  const projectedRewardDetail = nextQueuedTask
    ? `Next queue unlock ${nextQueuedTask.unlockAt.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })} - ${nextQueuedTask.task.type} session`
    : liveCount > 0
      ? `${liveCount} sessions ready right now.`
      : 'Queue completed for today.'

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div
          className="surface-glow overflow-hidden rounded-[30px] p-6 lg:col-span-2"
          style={{ backgroundImage: 'var(--gradient-hero-tasks)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
                Task grid
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Tier-based tasks matched to your account level
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Tier 1 starts with music and art. Tier 2 adds social follow and
                join tasks. Tier 3 adds ads. Tier 4 keeps everything in one queue.
              </p>
            </div>

          <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-overlay)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Bot assist
            </p>
            <p className="mt-2 font-medium text-[var(--text-primary)]">
              {aiBotSummary}
            </p>
            <Link
              to="/ai-bot"
              className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-[var(--glow)] transition hover:text-[var(--text-primary)]"
            >
              {aiBotActionLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Projected reward
        </p>
        <p className="mt-3 font-display text-4xl font-semibold text-[var(--text-primary)]">
          {formatUsd(projectedReward)}
        </p>
          <p className="mt-1 text-sm text-emerald-200">
            = {projectedRewardLocal.local}
          </p>
          {isLoading && (
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Syncing task data
            </p>
          )}
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            If you clear all today&apos;s sessions as each slot unlocks.
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
            {projectedRewardDetail}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Task credits
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-4xl font-semibold text-[var(--text-primary)]">
                {taskCredits}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Your tier tasks are included. Credits only add extra tasks after your daily tier queue is used.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPackTxHash('')
                setPackProofFile(null)
                setPackCryptoNetwork('USDT-TRC20')
                setIsPackModalOpen(true)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110"
            >
              Buy task pack
            </button>
          </div>
          {purchaseMessage && (
            <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {purchaseMessage}
            </p>
          )}
          {purchaseError && (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {purchaseError}
            </p>
          )}
        </div>
        <div className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Packs
          </p>
          <div className="mt-4 space-y-3">
            {taskPacks.map((pack) => (
              <div
                key={pack.id}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {pack.label}
                  </p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatUsd(pack.priceUsd)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {pack.tasks} credits added instantly.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Unlocked packs
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Pack history
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {packHistory.length} unlocked
            </p>
            <button
              type="button"
              onClick={() => void loadPackHistory()}
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {packHistoryLoading && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-center text-sm text-[var(--text-secondary)]">
              Loading pack history...
            </div>
          )}
          {!packHistoryLoading && packHistory.length === 0 && (
            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-5 text-center text-sm text-[var(--text-secondary)]">
              No unlocked packs yet.
            </div>
          )}
          {!packHistoryLoading &&
            packHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {entry.packLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {entry.tasks} credits • {formatUsd(entry.priceUsd)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                      Unlocked
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {formatHistoryDate(entry.processedAt || entry.requestedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Ready now</p>
            <Radio className="h-5 w-5 text-[var(--glow)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {liveCount}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Completed today
            </p>
            <Sparkles className="h-5 w-5 text-[var(--warning)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {completedCount}
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Opens later
            </p>
            <Palette className="h-5 w-5 text-[var(--blue)]" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-[var(--text-primary)]">
            {queuedLaterCount}
          </p>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Filters
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              Sort the active queue
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {taskFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={clsx(
                  'inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition',
                  selectedFilter === filter
                    ? 'border-[var(--border-strong)] bg-[rgba(124,58,237,0.16)] text-[var(--text-primary)]'
                    : 'border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                )}
              >
                <Filter className="h-4 w-4" />
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTasks.length === 0 && (
            <div className="col-span-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              No {selectedFilter === 'All' ? '' : `${selectedFilter.toLowerCase()} `}
              tasks available in this queue right now.
            </div>
          )}

          {paginatedTasks.map((task) => {
            const isCompleted = task.status === 'completed'
            const isLockedByTime = Boolean(task.isTimeLocked)
            const isLocked = isCompleted || isLockedByTime
            const isArtTask = task.type === 'Art'
            const isSocialTask = task.type === 'Social'
            const actionLabel = isCompleted
              ? 'Completed'
              : isLockedByTime
                ? `Opens ${task.unlockLabel || 'later'}`
                : task.status === 'live'
                  ? 'Resume Task'
                  : 'Start Task'
            const taskPlayerPath = `/tasks/${task.id}`

            return (
              <article
                key={task.id}
                className="group rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] p-4 transition hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-[22px]"
                >
                  <TaskCoverImage
                    src={task.coverImage}
                    type={task.type}
                    alt={`${task.title} cover art`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-black/12" />
                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                    <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                      {task.type}
                    </span>
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-sm',
                        isCompleted
                          ? 'border border-emerald-400/20 bg-emerald-400/15 text-emerald-200'
                          : isLockedByTime
                            ? 'border border-amber-300/25 bg-amber-300/15 text-amber-200'
                          : task.status === 'live'
                            ? 'border border-sky-400/20 bg-sky-400/15 text-sky-100'
                            : 'border border-white/20 bg-black/25 text-white/90',
                      )}
                    >
                      {isCompleted
                        ? 'Completed'
                        : isLockedByTime
                          ? 'Scheduled'
                        : task.status === 'live'
                          ? 'In progress'
                          : 'Ready'}
                    </span>
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <span className="inline-flex max-w-full rounded-2xl border border-white/18 bg-black/35 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                      <span className="truncate">{task.mood}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                    {task.title}
                  </h4>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {task.artist}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      {isArtTask || isSocialTask ? 'Action' : 'Duration'}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                      {isArtTask ? (
                        <>
                          <Heart className="h-4 w-4 text-[var(--warning)]" />
                          Like
                        </>
                      ) : isSocialTask ? (
                        <>
                          <Send className="h-4 w-4 text-sky-300" />
                          Follow
                        </>
                      ) : (
                        <>
                          <Clock3 className="h-4 w-4 text-[var(--glow)]" />
                          {task.duration}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Reward
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {formatUsd(task.reward)}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                      = {currencyConverter.formatDualFromUsd(task.reward).local}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <span>{task.reach} reach</span>
                  <span>{task.engagement} engagement</span>
                </div>

                {isLocked ? (
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--text-tertiary)]"
                  >
                    <Play className="h-4 w-4" />
                    {actionLabel}
                  </button>
                ) : (
                  <Link
                    to={taskPlayerPath}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[rgba(124,58,237,0.14)] text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[rgba(124,58,237,0.22)]"
                  >
                    <Play className="h-4 w-4" />
                    {actionLabel}
                  </Link>
                )}
              </article>
            )
          })}
        </div>
        <PaginationControls
          itemLabel="tasks"
          onPageChange={setTaskPage}
          page={taskPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredTasks.length}
        />
      </section>

      {isPackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-8 sm:items-center">
          <div className="w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-panel)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  Task pack
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  Purchase task credits
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Select a pack, confirm the amount, and complete payment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPackModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm text-[var(--text-secondary)]">
                Task pack
                <select
                  value={selectedPackId}
                  onChange={(event) => setSelectedPackId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                >
                  {taskPacks.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.label} • {formatUsd(pack.priceUsd)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-[var(--text-secondary)]">
                Amount (USD)
                <input
                  type="text"
                  readOnly
                  value={formatUsd(packAmountUsd)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition"
                />
                <span className="mt-2 block text-xs text-[var(--text-tertiary)]">
                  = {packAmountLocal.local}
                </span>
              </label>
            </div>

            {purchaseError && (
              <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {purchaseError}
              </p>
            )}

            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Crypto payment only
              </p>

              <label className="block text-sm text-[var(--text-secondary)]">
                Funding network
                <select
                  value={packCryptoNetwork}
                  onChange={(event) => {
                    setPackCryptoNetwork(event.target.value as PackCryptoNetwork)
                    setQrLoadError(false)
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                >
                  <option value="USDT-TRC20">USDT (TRC20)</option>
                  <option value="USDT-ERC20">USDT (ERC20)</option>
                  <option value="USDT-BEP20">USDT (BEP20)</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                </select>
              </label>

              <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--text-tertiary)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Wallet address
                </p>
                <div className="mt-2 grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="break-all text-[11px]">
                        {selectedWalletAddress || 'Not set'}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCopyWalletAddress(selectedWalletAddress)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                        aria-label="Copy wallet address"
                        title={copiedWallet ? 'Copied' : 'Copy'}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {copiedWallet && (
                      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
                        Copied
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-2">
                    {!qrLoadError && walletQrUrl ? (
                      <img
                        src={walletQrUrl}
                        alt="Scan QR code for payment address"
                        className="h-28 w-28 rounded-xl object-cover"
                        onError={() => setQrLoadError(true)}
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-[var(--border-soft)] text-center text-[11px] text-[var(--text-tertiary)]">
                        QR unavailable
                      </div>
                    )}
                    <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Scan To Pay
                    </p>
                  </div>
                </div>
              </div>

              <label className="block text-sm text-[var(--text-secondary)]">
                Transaction reference
                <input
                  type="text"
                  value={packTxHash}
                  onChange={(event) => setPackTxHash(event.target.value)}
                  placeholder="Paste the transaction reference"
                  className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)]"
                />
              </label>

              <label className="block text-sm text-[var(--text-secondary)]">
                Upload proof of payment (optional)
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setPackProofFile(file)
                  }}
                  className="mt-2 w-full rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(124,58,237,0.18)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPackModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handlePurchasePack()}
                disabled={purchaseBusy}
                className={clsx(
                  'inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition',
                  purchaseBusy ? 'cursor-wait opacity-80' : 'hover:brightness-110',
                )}
              >
                {purchaseBusy ? 'Processing...' : 'Confirm purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
