import { ART_COVER_ASSETS, MUSIC_COVER_ASSETS } from './asset-catalog'
import { AD_VIDEO_ASSETS } from './ad-video-catalog'
import { MUSIC_AUDIO_ASSETS } from './music-audio-catalog'
import {
  getAdCatalogProfile,
  getArtCatalogProfile,
  getMusicCatalogProfile,
} from './task-catalog-metadata'

export type TaskType = 'Music' | 'Ads' | 'Art' | 'Social'
export type TaskStatus = 'available' | 'live' | 'completed'

export type RewardTask = {
  id: string
  sourceTaskId?: string
  title: string
  artist: string
  duration: string
  reward: number
  type: TaskType
  status: TaskStatus
  mood: string
  coverImage: string
  mediaUrl?: string
  actionUrl?: string
  reach: string
  engagement: string
  scheduledAt?: string
  unlockLabel?: string
  isTimeLocked?: boolean
}

export type ActivityEntry = {
  id: string
  label: string
  category: 'Music' | 'Ads' | 'Art' | 'Social'
  amount: number
  time: string
  detail: string
}

const adDummyCovers = ['/images/mc20.jpg', '/images/mc21.webp', '/images/mc22.webp'] as const

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function secondsToDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${pad2(seconds)}`
}

function statusFromIndex(index: number): TaskStatus {
  if (index % 5 === 0) {
    return 'live'
  }

  return 'available'
}

function reachFromIndex(index: number) {
  const value = 2.8 + index * 0.37
  return `${value.toFixed(1)}K`
}

function engagementFromIndex(index: number) {
  const value = 74 + (index % 20)
  return `${value}%`
}

function buildMusicTasks(): RewardTask[] {
  const musicCount = Math.max(MUSIC_COVER_ASSETS.length, MUSIC_AUDIO_ASSETS.length)

  return Array.from({ length: musicCount }).map((_, index) => {
    const trackNo = index + 1
    const profile = getMusicCatalogProfile(index)
    const coverImage = MUSIC_COVER_ASSETS[index % MUSIC_COVER_ASSETS.length]
    const mediaUrl =
      MUSIC_AUDIO_ASSETS.length > 0
        ? MUSIC_AUDIO_ASSETS[index % MUSIC_AUDIO_ASSETS.length]
        : undefined

    return {
      id: `music-${trackNo}`,
      title: profile.title,
      artist: profile.artist,
      duration: secondsToDuration(30 + ((index % 5) * 6 + 6)),
      reward: Number((0.62 + (index % 8) * 0.04).toFixed(2)),
      type: 'Music',
      status: statusFromIndex(index),
      mood: profile.mood,
      coverImage,
      mediaUrl,
      reach: reachFromIndex(index),
      engagement: engagementFromIndex(index + 5),
    }
  })
}

function buildArtTasks(startIndex: number): RewardTask[] {
  return ART_COVER_ASSETS.map((coverImage, index) => {
    const artNo = index + 1
    const globalIndex = startIndex + index
    const profile = getArtCatalogProfile(index)

    return {
      id: `art-${artNo}`,
      title: profile.title,
      artist: profile.artist,
      duration: secondsToDuration(16 + ((index % 4) * 4 + 2)),
      reward: Number((0.45 + (index % 7) * 0.05).toFixed(2)),
      type: 'Art',
      status: statusFromIndex(globalIndex),
      mood: profile.mood,
      coverImage,
      reach: reachFromIndex(globalIndex),
      engagement: engagementFromIndex(globalIndex + 3),
    }
  })
}

function buildAdTasks(startIndex: number): RewardTask[] {
  const adCount = AD_VIDEO_ASSETS.length > 0 ? AD_VIDEO_ASSETS.length : 6

  return Array.from({ length: adCount }).map((_, index) => {
    const adNo = index + 1
    const globalIndex = startIndex + index
    const profile = getAdCatalogProfile(index)
    const mediaUrl =
      AD_VIDEO_ASSETS.length > 0
        ? AD_VIDEO_ASSETS[index % AD_VIDEO_ASSETS.length]
        : undefined

    return {
      id: `ad-${adNo}`,
      title: profile.title,
      artist: profile.artist,
      duration: secondsToDuration(15 + (index % 3) * 5),
      reward: Number((0.45 + (index % 4) * 0.08).toFixed(2)),
      type: 'Ads',
      status: statusFromIndex(globalIndex),
      mood: profile.mood,
      coverImage: adDummyCovers[index % adDummyCovers.length],
      mediaUrl,
      reach: reachFromIndex(globalIndex),
      engagement: engagementFromIndex(globalIndex + 2),
    }
  })
}

function buildSocialTasks(startIndex: number): RewardTask[] {
  const socialLinks = [
    ['Follow Binance on X', '@binance', 'https://x.com/binance', 'Crypto exchange updates'],
    ['Join Cointelegraph Telegram', 'Cointelegraph', 'https://t.me/cointelegraph', 'Crypto news stream'],
    ['Follow Coinbase on Instagram', '@coinbase', 'https://www.instagram.com/coinbase/', 'Exchange education posts'],
    ['Join CoinMarketCap Announcements', 'CoinMarketCap', 'https://t.me/CoinMarketCapAnnouncements', 'Market listings'],
    ['Follow Solana on X', '@solana', 'https://x.com/solana', 'Ecosystem updates'],
    ['Follow CoinGecko on Instagram', '@coingecko', 'https://www.instagram.com/coingecko/', 'Crypto charts'],
  ] as const

  return socialLinks.map(([title, account, actionUrl, mood], index) => {
    const globalIndex = startIndex + index

    return {
      id: `social-${index + 1}`,
      title,
      artist: `Social - ${account}`,
      duration: secondsToDuration(12 + (index % 4) * 3),
      reward: Number((0.38 + (index % 6) * 0.04).toFixed(2)),
      type: 'Social',
      status: statusFromIndex(globalIndex),
      mood,
      coverImage: MUSIC_COVER_ASSETS[(index + 3) % MUSIC_COVER_ASSETS.length] || '/images/mc6.jpg',
      actionUrl,
      reach: reachFromIndex(globalIndex),
      engagement: engagementFromIndex(globalIndex + 4),
    } satisfies RewardTask
  })
}

const musicTasks = buildMusicTasks()
const artTasks = buildArtTasks(musicTasks.length)
const socialTasks = buildSocialTasks(musicTasks.length + artTasks.length)
const adTasks = buildAdTasks(musicTasks.length + artTasks.length + socialTasks.length)

export const rewardTasks: RewardTask[] = [...musicTasks, ...artTasks, ...socialTasks, ...adTasks]

const liveCount = rewardTasks.filter((task) => task.status !== 'completed').length
const completedCount = rewardTasks.filter((task) => task.status === 'completed').length

export const dashboardSummary = {
  balance: 0,
  withdrawable: 0,
  todayEarnings: 0,
  weeklyEarnings: 0,
  dailyLimit: 12,
  streak: 0,
  taskCompletionRate: 0,
  activeQueue: liveCount,
  currentTier: 'Tier 1',
  nextTier: 'Tier 2',
  tierProgress: 12,
  aiBotStatus: 'Inactive',
  completedCount,
}
export const activityFeed: ActivityEntry[] = []
