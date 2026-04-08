import { useEffect, useMemo, useState } from 'react'
import type { TaskType } from '../data/platform-data'

type TaskCoverImageProps = {
  src: string
  type: TaskType
  alt: string
  className?: string
}

const typeFallback: Record<TaskType, string> = {
  Music: '/images/mc1.jpg',
  Art: '/arts/7788954.jpg',
  Ads: '/images/mc20.jpg',
}

const ultimateFallback = '/images/mc1.jpg'

function normalizeImageSource(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return trimmed
  }

  // Encode spaces and special chars in local asset paths (for names like "OIP (10).webp").
  if (trimmed.startsWith('/')) {
    try {
      return encodeURI(decodeURI(trimmed))
    } catch {
      return trimmed
    }
  }

  return trimmed
}

export function TaskCoverImage({ src, type, alt, className }: TaskCoverImageProps) {
  const preferredFallback = useMemo(() => normalizeImageSource(typeFallback[type]), [type])
  const normalizedPrimary = useMemo(() => {
    const source = src.trim().length > 0 ? src : preferredFallback
    return normalizeImageSource(source)
  }, [preferredFallback, src])
  const normalizedUltimateFallback = useMemo(
    () => normalizeImageSource(ultimateFallback),
    [],
  )
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setFailedSources(new Set())
  }, [normalizedPrimary, preferredFallback])

  const currentSource = useMemo(() => {
    if (!failedSources.has(normalizedPrimary)) {
      return normalizedPrimary
    }

    if (!failedSources.has(preferredFallback)) {
      return preferredFallback
    }

    return normalizedUltimateFallback
  }, [failedSources, normalizedPrimary, normalizedUltimateFallback, preferredFallback])

  return (
    <img
      src={currentSource}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSource === normalizedUltimateFallback) {
          return
        }

        setFailedSources((previous) => {
          if (previous.has(currentSource)) {
            return previous
          }

          const next = new Set(previous)
          next.add(currentSource)
          return next
        })
      }}
    />
  )
}
