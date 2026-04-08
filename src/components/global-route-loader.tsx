import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function GlobalRouteLoader() {
  const location = useLocation()
  const routeKey = `${location.pathname}${location.search}`
  const [isVisible, setIsVisible] = useState(true)
  const isFirstLoadRef = useRef(true)
  const hideTimerRef = useRef<number | null>(null)
  const hardStopTimerRef = useRef<number | null>(null)

  function clearHideTimer() {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function clearHardStopTimer() {
    if (hardStopTimerRef.current !== null) {
      window.clearTimeout(hardStopTimerRef.current)
      hardStopTimerRef.current = null
    }
  }

  function showFor(minimumMs: number) {
    clearHideTimer()
    clearHardStopTimer()
    setIsVisible(true)
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false)
    }, minimumMs)

    // Failsafe: loader should never remain visible indefinitely.
    hardStopTimerRef.current = window.setTimeout(() => {
      setIsVisible(false)
    }, minimumMs + 1400)
  }

  useEffect(() => {
    const minimumMs = isFirstLoadRef.current
      ? document.readyState === 'complete'
        ? 420
        : 760
      : 340

    isFirstLoadRef.current = false
    showFor(minimumMs)

    return () => {
      clearHideTimer()
      clearHardStopTimer()
    }
  }, [routeKey])

  useEffect(() => {
    return () => {
      clearHideTimer()
      clearHardStopTimer()
    }
  }, [])

  return (
    <div
      className={clsx(
        'global-route-loader fixed inset-0 z-[120] flex items-center justify-center transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      aria-hidden={!isVisible}
      aria-live="polite"
    >
      <div className="global-route-loader__veil absolute inset-0" />
      <div className="global-route-loader__spinner" />
    </div>
  )
}
