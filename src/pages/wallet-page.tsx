import clsx from 'clsx'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Disc3,
  Wallet,
  X,
} from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PaginationControls } from '../components/pagination-controls'
import {
  getDefaultCryptoWalletInstructions,
  getWalletAddressByNetwork,
  type CryptoNetwork,
} from '../lib/crypto-wallets'
import {
  getAuthenticatedUser,
  fetchSignupConfig,
  getAuthorizedHeaders,
  refreshAuthenticatedUser,
} from '../lib/auth'
import { showToast } from '../lib/toast'

type WalletStatus = 'Completed' | 'Pending' | 'Failed'
type WalletEntryKind = 'deposit' | 'withdrawal' | 'music'

type WalletEntry = {
  id: string
  title: string
  detail: string
  amount: number
  status: WalletStatus
  timeLabel: string
  kind: WalletEntryKind
  network?: CryptoNetwork
  proofUrl?: string
  occurredAt?: string
}

type WalletSummaryResponse = {
  wallet?: {
    balance?: number
    withdrawable?: number
    totalDepositedUsd?: number
    lastDepositAt?: string | null
    pendingDeposits?: number
  }
  taskCapacity?: {
    baseDailyLimit?: number
    extraTaskSlots?: number
    dailyLimit?: number
    usdPerExtraTask?: number
    maxExtraTaskSlots?: number
  }
}

type WalletDepositResponse = {
  message?: string
  wallet?: {
    balance?: number
    withdrawable?: number
  }
  taskCapacity?: {
    dailyLimit?: number
    extraTaskSlots?: number
    usdPerExtraTask?: number
  }
  deposit?: {
    amountUsd?: number
    network?: string
    reference?: string
    note?: string
    grantedTaskSlots?: number
  }
}

type WalletWithdrawResponse = {
  message?: string
  wallet?: {
    balance?: number
    withdrawable?: number
  }
}

type WalletHistoryResponse = {
  entries?: unknown
}

type WalletAddressOptionKey =
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'usdt_bep20'
  | 'btc'
  | 'eth'
  | 'sol'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.toString() || 'http://localhost:4000'
).replace(/\/$/, '')
const WALLET_SUMMARY_ENDPOINT = `${API_BASE_URL}/api/wallet/summary`
const WALLET_HISTORY_ENDPOINT = `${API_BASE_URL}/api/wallet/history`
const WALLET_DEPOSIT_ENDPOINT = `${API_BASE_URL}/api/wallet/deposit`
const WALLET_WITHDRAW_ENDPOINT = `${API_BASE_URL}/api/wallet/withdraw`
const WALLET_UPDATED_EVENT = 'rising-star:wallet-updated'
const SUPPORTED_PROOF_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['application/pdf', 'pdf'],
])

const usdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
})

const signedUsdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: 'currency',
})

function formatSignedUsd(value: number) {
  const absolute = signedUsdFormatter.format(Math.abs(value))
  return value >= 0 ? `+${absolute}` : `-${absolute}`
}

function entryIcon(kind: WalletEntryKind) {
  if (kind === 'deposit') {
    return ArrowDownLeft
  }
  if (kind === 'withdrawal') {
    return ArrowUpRight
  }
  return Disc3
}

function entryTone(kind: WalletEntryKind) {
  if (kind === 'deposit') {
    return 'bg-emerald-500/15 text-emerald-300'
  }
  if (kind === 'withdrawal') {
    return 'bg-rose-500/15 text-rose-300'
  }
  return 'bg-emerald-500/15 text-emerald-300'
}

function statusTone(status: WalletStatus) {
  if (status === 'Completed') {
    return 'bg-emerald-500/20 text-emerald-300'
  }
  if (status === 'Pending') {
    return 'bg-amber-500/20 text-amber-300'
  }
  return 'bg-rose-500/20 text-rose-300'
}

function resolveEntryNetwork(entry: WalletEntry) {
  if (entry.network) {
    return entry.network
  }

  const candidates = ['TRC20', 'ERC20', 'BEP20', 'SOL', 'BTC']
  const detail = entry.detail.toUpperCase()
  return candidates.find((network) => detail.includes(network)) ?? '--'
}

function isWalletStatus(value: unknown): value is WalletStatus {
  return value === 'Completed' || value === 'Pending' || value === 'Failed'
}

function isWalletEntryKind(value: unknown): value is WalletEntryKind {
  return value === 'deposit' || value === 'withdrawal' || value === 'music'
}

function isCryptoNetwork(value: unknown): value is CryptoNetwork {
  return (
    value === 'TRC20' ||
    value === 'ERC20' ||
    value === 'BEP20' ||
    value === 'SOL' ||
    value === 'BTC'
  )
}

function toWalletEntries(payload: unknown): WalletEntry[] {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as Record<string, unknown>

      if (
        typeof source.id !== 'string' ||
        typeof source.title !== 'string' ||
        typeof source.detail !== 'string' ||
        typeof source.amount !== 'number' ||
        typeof source.timeLabel !== 'string' ||
        !isWalletStatus(source.status) ||
        !isWalletEntryKind(source.kind)
      ) {
        return null
      }

      const network = isCryptoNetwork(source.network) ? source.network : undefined
      let proofUrl =
        typeof source.proofUrl === 'string' && source.proofUrl.trim().length > 0
          ? source.proofUrl.trim()
          : undefined

      if (proofUrl && proofUrl.startsWith('/')) {
        proofUrl = `${API_BASE_URL}${proofUrl}`
      }

      const occurredAt =
        typeof source.occurredAt === 'string' ? source.occurredAt : undefined

      return {
        id: source.id,
        title: source.title,
        detail: source.detail,
        amount: Number(source.amount),
        status: source.status,
        timeLabel: source.timeLabel,
        kind: source.kind,
        ...(network ? { network } : {}),
        ...(proofUrl ? { proofUrl } : {}),
        ...(occurredAt ? { occurredAt } : {}),
      } satisfies WalletEntry
    })
    .filter((entry): entry is WalletEntry => entry !== null)
}

export function WalletPage() {
  const PAGE_SIZE = 5
  const [walletInstructions, setWalletInstructions] = useState(
    getDefaultCryptoWalletInstructions(),
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(
    null,
  )
  const [depositStep, setDepositStep] = useState<1 | 2>(1)
  const [depositNetwork, setDepositNetwork] = useState<'' | CryptoNetwork>('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositReference, setDepositReference] = useState('')
  const [depositNote, setDepositNote] = useState('')
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNetwork, setWithdrawNetwork] = useState<'' | CryptoNetwork>('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawMemo, setWithdrawMemo] = useState('')
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<WalletEntry | null>(null)
  const [entriesPage, setEntriesPage] = useState(1)
  const [selectedWalletAddressKey, setSelectedWalletAddressKey] =
    useState<WalletAddressOptionKey>('usdt_trc20')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [qrLoadError, setQrLoadError] = useState(false)
  const authenticatedUser = getAuthenticatedUser()
  const [totalBalance, setTotalBalance] = useState(
    Number(authenticatedUser?.walletBalance || 0),
  )
  const [usdtBalance, setUsdtBalance] = useState(
    Number(authenticatedUser?.walletBalance || 0),
  )
  const [withdrawableBalance, setWithdrawableBalance] = useState(
    Number(authenticatedUser?.withdrawableBalance || 0),
  )
  const [pendingDeposits, setPendingDeposits] = useState(0)
  const [lastSummaryUpdatedAt, setLastSummaryUpdatedAt] = useState<Date | null>(
    null,
  )
  const [taskCapacityHint, setTaskCapacityHint] = useState('')
  const [depositSubmitting, setDepositSubmitting] = useState(false)
  const [depositError, setDepositError] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const proofFileSizeLabel = depositProofFile
    ? `${(depositProofFile.size / (1024 * 1024)).toFixed(2)} MB`
    : ''
  const depositAddress = getWalletAddressByNetwork(
    depositNetwork || 'ERC20',
    walletInstructions,
  )
  const entriesPageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const walletAddressOptions = useMemo(
    () => [
      {
        key: 'usdt_trc20' as const,
        label: 'USDT (TRC20)',
        address: walletInstructions.usdtTrc20Address,
      },
      {
        key: 'usdt_erc20' as const,
        label: 'USDT (ERC20)',
        address: walletInstructions.usdtErc20Address,
      },
      {
        key: 'usdt_bep20' as const,
        label: 'USDT (BEP20)',
        address: walletInstructions.usdtBep20Address,
      },
      { key: 'btc' as const, label: 'BTC', address: walletInstructions.btcAddress },
      { key: 'eth' as const, label: 'ETH', address: walletInstructions.ethAddress },
      { key: 'sol' as const, label: 'SOL', address: walletInstructions.solAddress },
    ],
    [walletInstructions],
  )
  const selectedWalletAddressOption = useMemo(() => {
    return (
      walletAddressOptions.find((option) => option.key === selectedWalletAddressKey) ||
      walletAddressOptions[0]
    )
  }, [selectedWalletAddressKey, walletAddressOptions])
  const qrPayload = useMemo(() => {
    if (!selectedWalletAddressOption || !activeModal) {
      return ''
    }

    const modeLabel = activeModal === 'deposit' ? 'Deposit' : 'Withdraw'
    const amountValue = Number(
      activeModal === 'deposit' ? depositAmount : withdrawAmount,
    )
    const amountLine =
      Number.isFinite(amountValue) && amountValue > 0
        ? `Amount USDT: ${amountValue.toFixed(2)}`
        : null

    return [
      `Rising Star Wallet ${modeLabel}`,
      amountLine,
      `Network: ${selectedWalletAddressOption.label}`,
      `Address: ${selectedWalletAddressOption.address}`,
    ]
      .filter(Boolean)
      .join('\n')
  }, [activeModal, depositAmount, selectedWalletAddressOption, withdrawAmount])
  const qrImageUrl = useMemo(() => {
    if (!qrPayload) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrPayload)}`
  }, [qrPayload])

  useEffect(() => {
    setEntriesPage((current) => Math.min(current, entriesPageCount))
  }, [entriesPageCount])

  useEffect(() => {
    setQrLoadError(false)
  }, [qrImageUrl])

  useEffect(() => {
    setCopyState('idle')
  }, [selectedWalletAddressKey])

  useEffect(() => {
    let isMounted = true

    async function loadWalletInstructions() {
      const config = await fetchSignupConfig()
      const crypto = config.paymentInstructions?.crypto

      if (!crypto || !isMounted) {
        return
      }

      setWalletInstructions({
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

  const loadWalletSummary = useCallback(async () => {
    try {
      const response = await fetch(WALLET_SUMMARY_ENDPOINT, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Wallet summary request failed')
      }

      const data = (await response.json()) as WalletSummaryResponse
      const nextBalance = Number(data.wallet?.balance || 0)
      const nextWithdrawable = Number(data.wallet?.withdrawable || 0)
      const nextPendingDeposits = Number(data.wallet?.pendingDeposits || 0)
      setTotalBalance(nextBalance)
      setUsdtBalance(nextBalance)
      setWithdrawableBalance(nextWithdrawable)
      setPendingDeposits(nextPendingDeposits)
      setLastSummaryUpdatedAt(new Date())

      const usdPerExtraTask = Number(data.taskCapacity?.usdPerExtraTask || 0)
      const extraTaskSlots = Number(data.taskCapacity?.extraTaskSlots || 0)
      const dailyLimit = Number(data.taskCapacity?.dailyLimit || 0)
      const baseDailyLimit = Number(data.taskCapacity?.baseDailyLimit || 0)

      if (usdPerExtraTask > 0) {
        const unlockedByDeposit = Math.max(0, dailyLimit - baseDailyLimit)
        setTaskCapacityHint(
          `+1 daily task per ${usdFormatter.format(usdPerExtraTask)} deposited. Bonus unlocked: ${Math.max(
            unlockedByDeposit,
            extraTaskSlots,
          )}.`,
        )
      } else {
        setTaskCapacityHint('')
      }
    } catch {
      const fallbackBalance = Number(getAuthenticatedUser()?.walletBalance || 0)
      const fallbackWithdrawable = Number(
        getAuthenticatedUser()?.withdrawableBalance || 0,
      )
      setTotalBalance(fallbackBalance)
      setUsdtBalance(fallbackBalance)
      setWithdrawableBalance(fallbackWithdrawable)
      setPendingDeposits(0)
      setLastSummaryUpdatedAt(new Date())
    }
  }, [])

  const loadWalletHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)

      const response = await fetch(WALLET_HISTORY_ENDPOINT, {
        headers: {
          ...getAuthorizedHeaders(),
        },
      })

      if (!response.ok) {
        throw new Error('Wallet history request failed')
      }

      const data = (await response.json()) as WalletHistoryResponse
      setEntries(toWalletEntries(data.entries))
      setEntriesPage(1)
    } catch {
      setEntries([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWalletSummary()
    void loadWalletHistory()
  }, [loadWalletHistory, loadWalletSummary])

  useEffect(() => {
    function handleWalletUpdated() {
      void loadWalletSummary()
      void loadWalletHistory()
    }

    window.addEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)

    return () => {
      window.removeEventListener(WALLET_UPDATED_EVENT, handleWalletUpdated)
    }
  }, [loadWalletHistory, loadWalletSummary])

  const paginatedEntries = useMemo(() => {
    const startIndex = (entriesPage - 1) * PAGE_SIZE
    return entries.slice(startIndex, startIndex + PAGE_SIZE)
  }, [entries, entriesPage])

  const pendingDepositsCount = pendingDeposits
  const lastUpdatedLabel = useMemo(() => {
    if (!lastSummaryUpdatedAt) {
      return 'Updated just now'
    }

    const deltaMs = Date.now() - lastSummaryUpdatedAt.getTime()
    if (deltaMs < 60 * 1000) {
      return 'Updated just now'
    }

    if (deltaMs < 60 * 60 * 1000) {
      const minutes = Math.max(1, Math.floor(deltaMs / (60 * 1000)))
      return `Updated ${minutes}m ago`
    }

    if (deltaMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(deltaMs / (60 * 60 * 1000))
      return `Updated ${hours}h ago`
    }

    const days = Math.floor(deltaMs / (24 * 60 * 60 * 1000))
    return `Updated ${days}d ago`
  }, [lastSummaryUpdatedAt])
  const pendingDepositsLabel = useMemo(() => {
    const pendingEntries = entries.filter(
      (entry) => entry.kind === 'deposit' && entry.status === 'Pending',
    )
    if (pendingEntries.length === 0) {
      return ''
    }

    const times = pendingEntries
      .map((entry) => (entry.occurredAt ? new Date(entry.occurredAt) : null))
      .filter((date): date is Date => Boolean(date) && !Number.isNaN(date.getTime()))
      .map((date) => date.getTime())

    if (times.length === 0) {
      return ''
    }

    const oldest = Math.min(...times)
    const deltaMs = Date.now() - oldest
    const minutes = Math.max(1, Math.floor(deltaMs / (60 * 1000)))

    if (minutes < 60) {
      return `${minutes}m ago`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }, [entries])

  async function handleCopyWalletAddress() {
    if (!selectedWalletAddressOption) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedWalletAddressOption.address)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('idle')
    }
  }

  function isPdfFile(url: string) {
    return url.toLowerCase().includes('.pdf')
  }

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

  function openDepositModal() {
    setActiveModal('deposit')
    setDepositStep(1)
    setDepositError('')
    setDepositNetwork('')
    setDepositAmount('')
    setDepositReference('')
    setDepositNote('')
    setDepositProofFile(null)
  }

  function openWithdrawModal() {
    setActiveModal('withdraw')
    setDepositStep(1)
    setWithdrawError('')
    setWithdrawAmount('')
    setWithdrawNetwork('')
    setWithdrawAddress('')
    setWithdrawMemo('')
  }

  async function handleDepositSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDepositError('')

    if (depositStep === 1) {
      setDepositStep(2)
      return
    }

    const amountValue = Number(depositAmount)
    const referenceValue = depositReference.trim()
    const noteValue = depositNote.trim()

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setDepositError('Enter a valid deposit amount.')
      return
    }

    if (!depositNetwork) {
      setDepositError('Select a funding network.')
      return
    }

    if (referenceValue.length < 3) {
      setDepositError('Enter a valid payment reference.')
      return
    }

    if (depositProofFile) {
      const maxBytes = 4 * 1024 * 1024
      if (depositProofFile.size > maxBytes) {
        setDepositError('Proof file is too large. Max size is 4 MB.')
        return
      }
    }

    setDepositSubmitting(true)

    try {
      let proofDataUrl: string | undefined

      if (depositProofFile) {
        const mimeType = resolveProofMime(depositProofFile)
        if (!mimeType) {
          throw new Error('Proof of payment must be a valid image or PDF')
        }

        proofDataUrl = await readFileAsDataUrl(depositProofFile, mimeType)

        if (!proofDataUrl) {
          throw new Error('Unable to read the uploaded proof file.')
        }

      }

      const response = await fetch(WALLET_DEPOSIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          amountUsd: Number(amountValue.toFixed(2)),
          network: depositNetwork,
          reference: referenceValue,
          note: noteValue,
          ...(proofDataUrl ? { proofDataUrl } : {}),
        }),
      })

      const data = (await response.json().catch(() => ({}))) as WalletDepositResponse

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : 'Unable to process deposit right now'
        throw new Error(message)
      }

      const nextBalance = Number(data.wallet?.balance || 0)
      setTotalBalance(nextBalance)
      setUsdtBalance(nextBalance)
      if (typeof data.wallet?.withdrawable === 'number') {
        setWithdrawableBalance(Number(data.wallet.withdrawable))
      }

      if (typeof data.taskCapacity?.usdPerExtraTask === 'number') {
        const bonusSlots = Number(data.taskCapacity.extraTaskSlots || 0)
        setTaskCapacityHint(
          `+1 daily task per ${usdFormatter.format(
            data.taskCapacity.usdPerExtraTask,
          )} deposited. Bonus unlocked: ${bonusSlots}.`,
        )
      }

      await refreshAuthenticatedUser()
      await loadWalletHistory()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT))
      }

      setActiveModal(null)
      setDepositStep(1)
      setDepositNetwork('')
      setDepositAmount('')
      setDepositReference('')
      setDepositNote('')
      setDepositProofFile(null)
      setDepositError('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to process deposit right now'
      setDepositError(message)
      showToast({
        title: message,
        variant: 'error',
      })
    } finally {
      setDepositSubmitting(false)
    }
  }

  async function handleWithdrawSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWithdrawError('')

    const amountValue = Number(withdrawAmount)
    const networkValue = withdrawNetwork
    const walletAddressValue = withdrawAddress.trim()
    const memoValue = withdrawMemo.trim()

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setWithdrawError('Enter a valid withdrawal amount.')
      return
    }

    if (!networkValue) {
      setWithdrawError('Select a funding network.')
      return
    }

    if (walletAddressValue.length < 10) {
      setWithdrawError('Enter a valid destination wallet address.')
      return
    }

    setWithdrawSubmitting(true)

    try {
      const response = await fetch(WALLET_WITHDRAW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthorizedHeaders(),
        },
        body: JSON.stringify({
          amountUsd: Number(amountValue.toFixed(2)),
          network: networkValue,
          walletAddress: walletAddressValue,
          memo: memoValue,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as WalletWithdrawResponse

      if (!response.ok) {
        const message =
          typeof data.message === 'string'
            ? data.message
            : 'Unable to submit withdrawal right now'
        throw new Error(message)
      }

      await loadWalletHistory()
      await loadWalletSummary()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT))
      }

      showToast({
        title:
          typeof data.message === 'string' && data.message.trim().length > 0
            ? data.message
            : 'Withdrawal request submitted.',
        variant: 'success',
      })

      setActiveModal(null)
      setWithdrawAmount('')
      setWithdrawNetwork('')
      setWithdrawAddress('')
      setWithdrawMemo('')
      setWithdrawError('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit withdrawal right now'
      setWithdrawError(message)
      showToast({
        title: message,
        variant: 'error',
      })
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  useEffect(() => {
    const requestedModal = searchParams.get('modal')
    if (!requestedModal) {
      return
    }

    if (requestedModal === 'deposit') {
      openDepositModal()
    }

    if (requestedModal === 'withdraw') {
      openWithdrawModal()
    }

    if (requestedModal === 'deposit' || requestedModal === 'withdraw') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('modal')
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div />
      </section>

        <section
          className="surface-glow rounded-[30px] border border-[var(--border-soft)] p-6 shadow-[var(--shadow-panel)] sm:p-8"
          style={{ backgroundImage: 'var(--gradient-hero-balance)' }}
        >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.16)] text-[var(--glow)]">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Total Balance
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Available to withdraw: {usdFormatter.format(withdrawableBalance)}
                  </p>
                </div>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                {lastUpdatedLabel}
              </p>
            </div>

            <div>
              <p className="font-display text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">
                {usdFormatter.format(totalBalance)}
              </p>
              <p className="mt-2 text-sm text-emerald-200">
                ≈ {usdFormatter.format(usdtBalance)} USDT
              </p>
              {pendingDepositsCount > 0 && (
                <p className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-amber-100">
                  {pendingDepositsCount} deposit
                  {pendingDepositsCount === 1 ? '' : 's'} pending
                  {pendingDepositsLabel ? ` • submitted ${pendingDepositsLabel}` : ''}
                </p>
              )}
              {taskCapacityHint && (
                <p className="mt-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  {taskCapacityHint}
                </p>
              )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openDepositModal}
              className="inline-flex h-11 w-full items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition hover:brightness-110 sm:w-auto"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Deposit USDT
            </button>
            <button
              type="button"
              onClick={openWithdrawModal}
              className="inline-flex h-11 w-full items-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-panel)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] sm:w-auto"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[var(--border-soft)] bg-[var(--surface-panel)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-panel)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Recent transactions
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
              History overview
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {entries.length} total
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {historyLoading && (
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              Loading transaction history...
            </div>
          )}
          {!historyLoading && entries.length === 0 && (
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
              No transactions yet.
            </div>
          )}
          {paginatedEntries.map((entry) => {
            const Icon = entryIcon(entry.kind)

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="flex w-full flex-col gap-4 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-panel-strong)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 text-[var(--text-primary)]">
                  <span
                    className={clsx(
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      entryTone(entry.kind),
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {entry.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {entry.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <p
                    className={clsx(
                      'font-display text-lg font-semibold',
                      entry.amount >= 0 ? 'text-emerald-200' : 'text-rose-300',
                    )}
                  >
                    {formatSignedUsd(entry.amount)}
                  </p>
                  <div className="flex flex-col items-start gap-2 text-xs text-[var(--text-secondary)] sm:items-end">
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1 ring-[var(--border-strong)]',
                        statusTone(entry.status),
                      )}
                    >
                      {entry.status}
                    </span>
                    <span>{entry.timeLabel}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <PaginationControls
          itemLabel="transactions"
          onPageChange={setEntriesPage}
          page={entriesPage}
          totalItems={entries.length}
        />
      </section>

      {(activeModal || selectedEntry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={() => {
              setActiveModal(null)
              setSelectedEntry(null)
            }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Close modal overlay"
          />
          {selectedEntry ? (
            <div className="relative w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] p-6 text-[var(--text-primary)] shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                    Transaction details
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                    {selectedEntry.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {selectedEntry.detail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  aria-label="Close transaction details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Amount
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                    {formatSignedUsd(selectedEntry.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Status
                  </p>
                  <span
                    className={clsx(
                      'mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1 ring-[var(--border-strong)]',
                      statusTone(selectedEntry.status),
                    )}
                  >
                    {selectedEntry.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Network
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {resolveEntryNetwork(selectedEntry)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Reference ID
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {selectedEntry.id}
                  </p>
                </div>
              </div>

                <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    Time
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                    {selectedEntry.timeLabel}
                  </p>
                </div>
                {selectedEntry.proofUrl && (
                  <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                      Proof of payment
                    </p>
                    <div className="mt-3 flex flex-col gap-3">
                      <a
                        href={selectedEntry.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                      >
                        Open proof file
                      </a>
                      {!isPdfFile(selectedEntry.proofUrl) && (
                        <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)]">
                          <img
                            src={selectedEntry.proofUrl}
                            alt="Uploaded proof of payment"
                            className="w-full max-h-64 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div className="relative w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface-panel-strong)] p-6 text-[var(--text-primary)] shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  {activeModal === 'deposit' ? 'Deposit' : 'Withdraw'}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {activeModal === 'deposit' && depositStep === 1
                    ? 'Add USDT to your wallet'
                    : activeModal === 'deposit'
                      ? 'Complete your deposit'
                      : 'Send USDT to another wallet'}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {activeModal === 'deposit' && depositStep === 1
                    ? 'Select a network and add a reference for this deposit.'
                    : activeModal === 'deposit'
                      ? 'Copy the deposit address and upload proof of payment.'
                      : 'Confirm the amount and destination wallet address.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeModal === 'deposit' && (
              <div className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                <label className="block text-sm text-[var(--text-secondary)]">
                  Crypto address
                  <select
                    value={selectedWalletAddressKey}
                    onChange={(event) =>
                      setSelectedWalletAddressKey(
                        event.target.value as WalletAddressOptionKey,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--border-strong)]"
                  >
                    {walletAddressOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedWalletAddressOption && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        Wallet address
                      </p>
                      <p className="mt-2 break-all text-sm font-medium text-[var(--text-primary)]">
                        {selectedWalletAddressOption.address}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-9 items-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                          {selectedWalletAddressOption.label}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyWalletAddress}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                        >
                          {copyState === 'copied' ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copyState === 'copied' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-panel)] p-3">
                      <div className="mx-auto w-fit rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-2">
                        {!qrLoadError && qrImageUrl ? (
                          <img
                            src={qrImageUrl}
                            alt={`Scan QR barcode for ${selectedWalletAddressOption.label}`}
                            className="h-32 w-32 rounded-lg object-cover"
                            onError={() => setQrLoadError(true)}
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-[var(--border-soft)] text-center text-[11px] text-[var(--text-tertiary)]">
                            QR unavailable
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                        Scan to pay
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeModal === 'deposit' ? (
              <form
                className="mt-6 space-y-4"
                onSubmit={handleDepositSubmit}
              >
                {depositStep === 1 ? (
                  <>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      Amount (USDT)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(event) => setDepositAmount(event.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Funding network
                      <select
                        required
                        value={depositNetwork}
                        onChange={(event) =>
                          setDepositNetwork(
                            event.target.value as '' | CryptoNetwork,
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      >
                        <option value="" disabled className="bg-[var(--surface-panel)] text-[var(--text-primary)]">
                          Select network
                        </option>
                        <option value="TRC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">TRC20</option>
                        <option value="ERC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">ERC20</option>
                        <option value="BEP20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BEP20</option>
                        <option value="SOL" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">SOL</option>
                        <option value="BTC" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BTC</option>
                      </select>
                    </label>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Reference
                      <input
                        type="text"
                        required
                        placeholder="Invoice, order, or note"
                        value={depositReference}
                        onChange={(event) =>
                          setDepositReference(event.target.value)
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="rounded-[20px] border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Deposit address
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-sm font-medium text-[var(--text-primary)]">
                          {depositAddress}
                        </p>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-panel)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
                          aria-label="Copy deposit address"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(depositAddress)
                            } catch {
                              // Ignore clipboard permission issues in embedded browsers.
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Upload proof of payment (optional)
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null
                          setDepositProofFile(file)
                        }}
                        className="mt-2 w-full rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(124,58,237,0.18)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                      />
                      {depositProofFile && (
                        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                          Selected: {depositProofFile.name} • {proofFileSizeLabel}
                        </p>
                      )}
                    </label>

                    <label className="block text-sm text-[var(--text-secondary)]">
                      Note (optional)
                      <input
                        type="text"
                        placeholder="Add a note for this deposit"
                        value={depositNote}
                        onChange={(event) => setDepositNote(event.target.value)}
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                      />
                    </label>
                  </>
                )}

                {depositError && (
                  <p className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {depositError}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      depositStep === 1
                        ? setActiveModal(null)
                        : setDepositStep(1)
                    }
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    {depositStep === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={depositSubmitting}
                    className={clsx(
                      'inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition',
                      depositSubmitting
                        ? 'cursor-wait opacity-80'
                        : 'hover:brightness-110',
                    )}
                  >
                    {depositSubmitting
                      ? 'Submitting...'
                      : depositStep === 1
                        ? 'Continue'
                        : 'Submit deposit'}
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={handleWithdrawSubmit}
              >
                <label className="block text-sm text-[var(--text-secondary)]">
                  Amount (USDT)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  Funding network
                  <select
                    required
                    value={withdrawNetwork}
                    onChange={(event) =>
                      setWithdrawNetwork(
                        event.target.value as '' | CryptoNetwork,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  >
                    <option value="" disabled className="bg-[var(--surface-panel)] text-[var(--text-primary)]">
                      Select network
                    </option>
                    <option value="TRC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">TRC20</option>
                    <option value="ERC20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">ERC20</option>
                    <option value="BEP20" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BEP20</option>
                    <option value="SOL" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">SOL</option>
                    <option value="BTC" className="bg-[var(--surface-panel)] text-[var(--text-primary)]">BTC</option>
                  </select>
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  To wallet address
                  <input
                    type="text"
                    required
                    placeholder="0x1234...destination"
                    value={withdrawAddress}
                    onChange={(event) =>
                      setWithdrawAddress(event.target.value)
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block text-sm text-[var(--text-secondary)]">
                  Memo (optional)
                  <input
                    type="text"
                    placeholder="Reference or note"
                    value={withdrawMemo}
                    onChange={(event) => setWithdrawMemo(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]"
                  />
                </label>

                {withdrawError && (
                  <p className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {withdrawError}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawSubmitting}
                    className={clsx(
                      'inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.35)] transition',
                      withdrawSubmitting ? 'cursor-wait opacity-80' : 'hover:brightness-110',
                    )}
                  >
                    {withdrawSubmitting ? 'Submitting...' : 'Confirm withdrawal'}
                  </button>
                </div>
                </form>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  )
}


