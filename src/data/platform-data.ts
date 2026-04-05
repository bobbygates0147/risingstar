import afterglowMotionCover from '../assets/task-covers/afterglow-motion.svg'
import cityLightsAdCover from '../assets/task-covers/city-lights-ad.svg'
import flashdropVisualCover from '../assets/task-covers/flashdrop-visual.svg'
import galleryBloomCover from '../assets/task-covers/gallery-bloom.svg'
import goldenEchoCover from '../assets/task-covers/golden-echo.svg'
import museumGlowCover from '../assets/task-covers/museum-glow.svg'
import moonlineRushCover from '../assets/task-covers/moonline-rush.svg'
import prismCanvasCover from '../assets/task-covers/prism-canvas.svg'
import pulseHubPromoCover from '../assets/task-covers/pulse-hub-promo.svg'
import velvetCodeCover from '../assets/task-covers/velvet-code.svg'
import wildfireLaneCover from '../assets/task-covers/wildfire-lane.svg'

export type TaskType = 'Music' | 'Ads' | 'Art'
export type TaskStatus = 'available' | 'live' | 'completed'

export type RewardTask = {
  id: string
  title: string
  artist: string
  duration: string
  reward: number
  type: TaskType
  status: TaskStatus
  mood: string
  coverImage: string
  reach: string
  engagement: string
}

export type ActivityEntry = {
  id: string
  label: string
  category: 'Music' | 'Ads' | 'Art' | 'Deposit'
  amount: number
  time: string
  detail: string
}

export const dashboardSummary = {
  balance: 248_500,
  withdrawable: 124_000,
  todayEarnings: 7_350,
  weeklyEarnings: 41_800,
  dailyLimit: 10_000,
  streak: 11,
  taskCompletionRate: 82,
  activeQueue: 8,
  currentTier: 'Tier 2',
  nextTier: 'Tier 3',
  tierProgress: 68,
  aiBotStatus: 'Inactive',
}

export const rewardTasks: RewardTask[] = [
  {
    id: 'moonline',
    title: 'Moonline Rush',
    artist: 'Nova Kade',
    duration: '0:30',
    reward: 120,
    type: 'Music',
    status: 'live',
    mood: 'Synthwave pulse',
    coverImage: moonlineRushCover,
    reach: '8.2K',
    engagement: '91%',
  },
  {
    id: 'golden-echo',
    title: 'Golden Echo',
    artist: 'Zuri Vale',
    duration: '0:45',
    reward: 150,
    type: 'Music',
    status: 'available',
    mood: 'Afro-fusion anthem',
    coverImage: goldenEchoCover,
    reach: '12.7K',
    engagement: '88%',
  },
  {
    id: 'gallery-bloom',
    title: 'Gallery Bloom',
    artist: 'Mira Sol',
    duration: '0:18',
    reward: 95,
    type: 'Art',
    status: 'available',
    mood: 'Like abstract showcase',
    coverImage: galleryBloomCover,
    reach: '6.8K',
    engagement: '89%',
  },
  {
    id: 'flashdrop',
    title: 'Flashdrop Visual',
    artist: 'Brand Partner',
    duration: '0:20',
    reward: 80,
    type: 'Ads',
    status: 'available',
    mood: 'Short sponsored clip',
    coverImage: flashdropVisualCover,
    reach: '4.1K',
    engagement: '79%',
  },
  {
    id: 'velvet-code',
    title: 'Velvet Code',
    artist: 'AYR',
    duration: '0:35',
    reward: 110,
    type: 'Music',
    status: 'completed',
    mood: 'Late-night drill',
    coverImage: velvetCodeCover,
    reach: '5.9K',
    engagement: '84%',
  },
  {
    id: 'city-lights',
    title: 'City Lights Ad',
    artist: 'Motion Lab',
    duration: '0:25',
    reward: 90,
    type: 'Ads',
    status: 'available',
    mood: 'Product trailer',
    coverImage: cityLightsAdCover,
    reach: '3.8K',
    engagement: '76%',
  },
  {
    id: 'afterglow',
    title: 'Afterglow Motion',
    artist: 'Kairo',
    duration: '0:40',
    reward: 145,
    type: 'Music',
    status: 'available',
    mood: 'Soul-pop crossover',
    coverImage: afterglowMotionCover,
    reach: '10.3K',
    engagement: '93%',
  },
  {
    id: 'prism-canvas',
    title: 'Prism Canvas',
    artist: 'Arlo Muse',
    duration: '0:22',
    reward: 105,
    type: 'Art',
    status: 'live',
    mood: 'Like modern gallery post',
    coverImage: prismCanvasCover,
    reach: '7.5K',
    engagement: '92%',
  },
  {
    id: 'pulse-hub',
    title: 'Pulse Hub Promo',
    artist: 'Partner Stack',
    duration: '0:15',
    reward: 60,
    type: 'Ads',
    status: 'completed',
    mood: 'Fast conversion spot',
    coverImage: pulseHubPromoCover,
    reach: '2.4K',
    engagement: '74%',
  },
  {
    id: 'wildfire',
    title: 'Wildfire Lane',
    artist: 'Juno Redd',
    duration: '0:50',
    reward: 170,
    type: 'Music',
    status: 'available',
    mood: 'High-energy campaign',
    coverImage: wildfireLaneCover,
    reach: '14.6K',
    engagement: '95%',
  },
  {
    id: 'museum-glow',
    title: 'Museum Glow',
    artist: 'Nia Hart',
    duration: '0:16',
    reward: 88,
    type: 'Art',
    status: 'completed',
    mood: 'Liked curated paint post',
    coverImage: museumGlowCover,
    reach: '5.6K',
    engagement: '87%',
  },
]

export const activityFeed: ActivityEntry[] = [
  {
    id: 'act-1',
    label: 'Music task completed',
    category: 'Music',
    amount: 120,
    time: '2 mins ago',
    detail: 'Moonline Rush by Nova Kade',
  },
  {
    id: 'act-2',
    label: 'Art post liked',
    category: 'Art',
    amount: 95,
    time: '18 mins ago',
    detail: 'Gallery Bloom by Mira Sol',
  },
  {
    id: 'act-3',
    label: 'Wallet deposit settled',
    category: 'Deposit',
    amount: 75_000,
    time: '1 hr ago',
    detail: 'USDT deposit cleared to wallet',
  },
  {
    id: 'act-4',
    label: 'Ad watch rewarded',
    category: 'Ads',
    amount: 80,
    time: '3 hrs ago',
    detail: 'Flashdrop Visual',
  },
  {
    id: 'act-5',
    label: 'Music task completed',
    category: 'Music',
    amount: 145,
    time: 'Today, 09:14',
    detail: 'Afterglow Motion by Kairo',
  },
]
