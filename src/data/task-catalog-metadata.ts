type CatalogTaskType = 'Music' | 'Ads' | 'Art'

type CatalogProfile = {
  title: string
  artist: string
  mood: string
}

const LEGACY_MUSIC_ARTISTS = new Set([
  'nova kade',
  'zuri vale',
  'ayr',
  'kairo',
  'juno redd',
  'ari moss',
  'nexus nine',
  'luna shore',
])

const LEGACY_ARTISTS = new Set([
  'mira sol',
  'arlo muse',
  'nia hart',
  'kai dune',
  'rumi ash',
  'lio voss',
  'ana crest',
])

export const MUSIC_TASK_PROFILES: readonly CatalogProfile[] = [
  {
    title: 'DGK Preview',
    artist: 'Amuly feat. Aerozen',
    mood: 'Romanian trap preview',
  },
  {
    title: 'Relatie cu Bancnotele',
    artist: 'Azteca',
    mood: 'Official street single',
  },
  {
    title: 'Indonesia Sayang: Cyber Disco Remix',
    artist: 'Cyber Disco Indonesia',
    mood: 'Bass-boosted party remix',
  },
  {
    title: 'Jakarta Live Set: Opening Sequence',
    artist: 'DJ CREAM',
    mood: 'Indonesian hits live set',
  },
  {
    title: 'Jakarta Live Set: Night Market Cut',
    artist: 'DJ CREAM',
    mood: 'Festival crowd energy',
  },
  {
    title: 'Jakarta Live Set: Neon Bridge',
    artist: 'DJ CREAM',
    mood: 'Club transition mix',
  },
  {
    title: 'Jakarta Live Set: Golden Hour Drop',
    artist: 'DJ CREAM',
    mood: 'High-tempo dance blend',
  },
  {
    title: 'Jakarta Live Set: Radio Heat',
    artist: 'DJ CREAM',
    mood: 'Pop-dance throwback',
  },
  {
    title: 'Jakarta Live Set: Afterparty Loop',
    artist: 'DJ CREAM',
    mood: 'Late-night house rotation',
  },
  {
    title: 'Jakarta Live Set: Skyline Run',
    artist: 'DJ CREAM',
    mood: 'Peak-hour live mix',
  },
  {
    title: 'Jakarta Live Set: Streetlight Encore',
    artist: 'DJ CREAM',
    mood: 'Crowd-ready remix pass',
  },
  {
    title: 'Jakarta Live Set: Final Flash',
    artist: 'DJ CREAM',
    mood: 'Closing-room energy',
  },
  {
    title: 'Jakarta Live Set: Downtown Pulse',
    artist: 'DJ CREAM',
    mood: 'Dancefloor reset',
  },
  {
    title: 'Jakarta Live Set: Metro Groove',
    artist: 'DJ CREAM',
    mood: 'Live remix selection',
  },
  {
    title: 'Jakarta Live Set: Sunrise Break',
    artist: 'DJ CREAM',
    mood: 'Melodic live blend',
  },
  {
    title: 'Jakarta Live Set: Signal Boost',
    artist: 'DJ CREAM',
    mood: 'Radio-ready club mix',
  },
  {
    title: 'Jakarta Live Set: Rush Hour',
    artist: 'DJ CREAM',
    mood: 'High-energy city mix',
  },
  {
    title: 'Jakarta Live Set: Encore Edit',
    artist: 'DJ CREAM',
    mood: 'Live set highlight',
  },
  {
    title: 'Jakarta Live Set: Warehouse Cut',
    artist: 'DJ CREAM',
    mood: 'Underground dance mix',
  },
  {
    title: 'Jakarta Live Set: Mainstage Edit',
    artist: 'DJ CREAM',
    mood: 'Festival anthem blend',
  },
  {
    title: 'Jakarta Live Set: Full Circle',
    artist: 'DJ CREAM',
    mood: 'Classic hits live set',
  },
  {
    title: 'Do You Remember Me: Tape One',
    artist: 'Indie Playlist Select',
    mood: 'Dreamy indie playlist',
  },
  {
    title: 'Do You Remember Me: Window Seat',
    artist: 'Indie Playlist Select',
    mood: 'Soft-focus indie rotation',
  },
  {
    title: 'Do You Remember Me: Static Bloom',
    artist: 'Indie Playlist Select',
    mood: 'Lo-fi memory loop',
  },
  {
    title: 'Do You Remember Me: Quiet Roads',
    artist: 'Indie Playlist Select',
    mood: 'Late-night indie mix',
  },
  {
    title: 'Do You Remember Me: Blue Room',
    artist: 'Indie Playlist Select',
    mood: 'Bedroom-pop collection',
  },
  {
    title: 'Do You Remember Me: Polaroid Fade',
    artist: 'Indie Playlist Select',
    mood: 'Nostalgic indie queue',
  },
  {
    title: 'Do You Remember Me: Cassette Weather',
    artist: 'Indie Playlist Select',
    mood: 'Warm analog playlist',
  },
  {
    title: 'Do You Remember Me: Original Playlist',
    artist: 'Indie Playlist Select',
    mood: 'Curated indie session',
  },
  {
    title: 'Do You Remember Me: Extended Playlist',
    artist: 'Indie Playlist Select',
    mood: 'Indie discovery set',
  },
  {
    title: 'Global Underground 026: Romania CD2 Cut 1',
    artist: 'Global Underground',
    mood: 'Progressive underground mix',
  },
  {
    title: 'Global Underground 026: Romania CD2 Cut 2',
    artist: 'Global Underground',
    mood: 'Deep club sequence',
  },
  {
    title: 'Global Underground 026: Romania CD2 Cut 3',
    artist: 'Global Underground',
    mood: 'Afterhours progressive set',
  },
  {
    title: 'Global Underground 026: Romania CD2 Cut 4',
    artist: 'Global Underground',
    mood: 'Underground travel mix',
  },
  {
    title: 'Global Underground 026: Romania CD2',
    artist: 'Global Underground',
    mood: 'Classic club journey',
  },
  {
    title: 'Giulesti Crangasi',
    artist: 'RAVA',
    mood: 'Official street video cut',
  },
]

export const AD_TASK_PROFILES: readonly CatalogProfile[] = [
  {
    title: 'Ten-Second Product Teaser',
    artist: 'Sponsor Studio',
    mood: 'Fast brand recall spot',
  },
  {
    title: 'Air Asia Billboard Motion Spot',
    artist: 'Air Asia',
    mood: 'Travel campaign clip',
  },
  {
    title: 'Business Success Formula',
    artist: 'Growth Campaign Studio',
    mood: 'Small-business promo',
  },
  {
    title: 'Go Good Drinks Product Film',
    artist: 'Go Good Drinks',
    mood: 'Cinematic beverage spot',
  },
  {
    title: 'FileBox Storage Box Spot',
    artist: 'FileBox',
    mood: 'Home organization promo',
  },
  {
    title: 'Clean Car Safety Reminder',
    artist: 'Auto Care Sponsor',
    mood: 'Public safety product tip',
  },
  {
    title: 'Pandiyar Kudil Grocery Promo',
    artist: 'Pandiyar Kudil',
    mood: 'Online grocery campaign',
  },
  {
    title: 'Rubic Business Loans',
    artist: 'Rubic',
    mood: 'Financial services promo',
  },
  {
    title: 'Skin Care Product Commercial',
    artist: 'Beauty Campaign Studio',
    mood: 'Beauty product showcase',
  },
  {
    title: 'Doritos Sling Baby Classic',
    artist: 'Doritos',
    mood: 'Snack brand commercial',
  },
  {
    title: 'Soft Drink Motion Promo',
    artist: 'Beverage Motion Studio',
    mood: 'Animated drink campaign',
  },
  {
    title: 'Vu Smart TV Feature Spot',
    artist: 'Sysmantech',
    mood: 'Consumer tech promo',
  },
  {
    title: 'Vajra Wellness Video Brochure',
    artist: 'Vajra Wellness',
    mood: 'Wellness brand story',
  },
  {
    title: 'Lifestyle Campaign Reel',
    artist: 'Brand Motion Studio',
    mood: 'Short sponsor reel',
  },
  {
    title: 'Retail Launch Teaser',
    artist: 'Commerce Creative Lab',
    mood: 'Product awareness clip',
  },
  {
    title: 'Digital Promo Highlight',
    artist: 'Campaign Studio',
    mood: 'Sponsored video highlight',
  },
  {
    title: 'Coca-Cola Ten-Second Commercial',
    artist: 'Coca-Cola',
    mood: 'Soft drink brand spot',
  },
  {
    title: 'Wheels & Miles Transport Promo',
    artist: 'Wheels & Miles',
    mood: 'Employee transport campaign',
  },
  {
    title: 'Winworth Financial Services',
    artist: 'Winworth Groups',
    mood: 'Finance brand campaign',
  },
  {
    title: 'World No Tobacco Day PSA',
    artist: 'Public Health Campaign',
    mood: 'Awareness message',
  },
]

const artTitlePrefixes = [
  'Chromatic',
  'Velvet',
  'Signal',
  'Prism',
  'Museum',
  'Golden',
  'Gallery',
  'Afterglow',
  'Kinetic',
  'Solar',
  'Fragmented',
  'Electric',
  'Botanical',
  'Marble',
  'Surreal',
  'Vivid',
  'Silent',
  'Paper',
  'Neon',
  'Modern',
  'Luminous',
  'Analog',
  'Urban',
  'Celestial',
] as const

const artTitleSubjects = [
  'Drift',
  'Portrait',
  'Bloom',
  'Canvas',
  'Echo',
  'Relic',
  'Spectrum',
  'Vista',
  'Collage',
  'Horizon',
  'Gesture',
  'Atrium',
  'Pulse',
  'Mirage',
  'Fable',
  'Archive',
  'Myth',
  'Orbit',
  'Still Life',
  'Wall Study',
  'Garden',
  'Sculpture',
  'Monologue',
  'Reverie',
  'Field',
  'Glyph',
  'Sonata',
  'Ember',
  'Threshold',
] as const

const artArtistFirstNames = [
  'Mira',
  'Arlo',
  'Nia',
  'Kai',
  'Rumi',
  'Lio',
  'Ana',
  'Soren',
  'Elia',
  'Noor',
  'Tavi',
  'Iris',
  'Oren',
  'Mika',
  'Vera',
  'Levi',
] as const

const artArtistLastNames = [
  'Sol',
  'Muse',
  'Hart',
  'Dune',
  'Ash',
  'Voss',
  'Crest',
  'Vale',
  'Stone',
  'Ray',
  'Wren',
  'Ames',
  'Lark',
  'Reed',
  'Kade',
  'Morrow',
] as const

const artMoods = [
  'Curated visual drop',
  'Modern gallery post',
  'Abstract showcase',
  'Studio color study',
  'Concept portrait set',
  'Limited visual feature',
  'Collector spotlight',
  'Contemporary art like',
] as const

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0
  }

  if (!Number.isFinite(index) || index < 0) {
    return 0
  }

  return Math.floor(index) % length
}

function getProfile(
  profiles: readonly CatalogProfile[],
  index: number,
): CatalogProfile {
  return profiles[wrapIndex(index, profiles.length)]
}

function getZeroBasedCatalogIndex(
  type: CatalogTaskType,
  taskKey: string,
  fallbackTitle: string,
) {
  const source = `${taskKey} ${fallbackTitle}`
  const patterns: Record<CatalogTaskType, RegExp[]> = {
    Music: [
      /music[-_ #]*(\d+)/i,
      /music\s+session[-_ #]*(\d+)/i,
      /track[-_ #]*(\d+)/i,
    ],
    Art: [/art[-_ #]*(\d+)/i, /art\s+session[-_ #]*(\d+)/i],
    Ads: [/ad[-_ #]*(\d+)/i, /sponsored\s+slot[-_ #]*(\d+)/i],
  }

  for (const pattern of patterns[type]) {
    const match = pattern.exec(source)
    const parsed = Number.parseInt(match?.[1] ?? '', 10)

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed - 1
    }
  }

  return 0
}

function isGenericTitle(type: CatalogTaskType, title: string) {
  const normalized = title.trim().toLowerCase()

  if (!normalized) {
    return true
  }

  if (type === 'Music') {
    return /^(music|track|music session)(?:\s*[-_#]?\s*\d+)?$/.test(normalized)
  }

  if (type === 'Art') {
    return /^(art|artwork|art session)(?:\s*[-_#]?\s*\d+)?$/.test(normalized)
  }

  return /^(ad|ads|advert|advertisement|sponsored slot|sponsor slot|video)(?:\s*[-_#]?\s*\d+)?$/.test(
    normalized,
  )
}

function isGenericArtist(artist: string) {
  const normalized = artist.trim().toLowerCase()

  return (
    !normalized ||
    normalized === 'artist' ||
    normalized === 'creator' ||
    normalized === 'uploader' ||
    normalized === 'unknown' ||
    normalized === 'unknown artist' ||
    normalized === 'unknown creator' ||
    normalized === 'brand partner'
  )
}

function isLegacyArtist(type: CatalogTaskType, artist: string) {
  const normalized = artist.trim().toLowerCase()

  if (type === 'Music') {
    return LEGACY_MUSIC_ARTISTS.has(normalized)
  }

  if (type === 'Art') {
    return LEGACY_ARTISTS.has(normalized)
  }

  return normalized === 'brand partner' || normalized === 'partner stack'
}

export function getMusicCatalogProfile(index: number) {
  return getProfile(MUSIC_TASK_PROFILES, index)
}

export function getAdCatalogProfile(index: number) {
  return getProfile(AD_TASK_PROFILES, index)
}

export function getArtCatalogProfile(index: number): CatalogProfile {
  const safeIndex = Math.max(Math.floor(Number.isFinite(index) ? index : 0), 0)
  const titlePrefix = artTitlePrefixes[wrapIndex(safeIndex, artTitlePrefixes.length)]
  const titleSubject = artTitleSubjects[wrapIndex(safeIndex * 7 + 3, artTitleSubjects.length)]
  const firstName =
    artArtistFirstNames[wrapIndex(safeIndex * 5 + 2, artArtistFirstNames.length)]
  const lastName =
    artArtistLastNames[wrapIndex(safeIndex * 7 + 4, artArtistLastNames.length)]
  const mood = artMoods[wrapIndex(safeIndex * 3 + 1, artMoods.length)]

  return {
    title: `${titlePrefix} ${titleSubject}`,
    artist: `${firstName} ${lastName}`,
    mood,
  }
}

export function getTaskCatalogProfile(
  type: CatalogTaskType,
  taskKey: string,
  fallbackTitle: string,
) {
  const index = getZeroBasedCatalogIndex(type, taskKey, fallbackTitle)

  if (type === 'Music') {
    return getMusicCatalogProfile(index)
  }

  if (type === 'Ads') {
    return getAdCatalogProfile(index)
  }

  return getArtCatalogProfile(index)
}

export function resolveTaskTitle(
  type: CatalogTaskType,
  taskKey: string,
  fallbackTitle: string,
) {
  const cleanTitle = fallbackTitle.trim()

  if (!isGenericTitle(type, cleanTitle)) {
    return cleanTitle
  }

  return getTaskCatalogProfile(type, taskKey, fallbackTitle).title
}

export function resolveTaskArtist(
  type: CatalogTaskType,
  taskKey: string,
  fallbackTitle: string,
  fallbackArtist: string,
) {
  const cleanArtist = fallbackArtist.trim()
  const hasGenericTitle = isGenericTitle(type, fallbackTitle)

  if (
    !hasGenericTitle &&
    !isGenericArtist(cleanArtist) &&
    !isLegacyArtist(type, cleanArtist)
  ) {
    return cleanArtist
  }

  return getTaskCatalogProfile(type, taskKey, fallbackTitle).artist
}

export function resolveTaskMood(
  type: CatalogTaskType,
  taskKey: string,
  fallbackTitle: string,
  fallbackMood: string,
) {
  const cleanMood = fallbackMood.trim()

  if (!isGenericTitle(type, fallbackTitle) && cleanMood) {
    return cleanMood
  }

  return getTaskCatalogProfile(type, taskKey, fallbackTitle).mood
}
