'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ListingImage = {
  url: string
  alt_text: string
  is_cover: boolean
  sort_order: number
}

const AUTO_PLAY_DELAY = 5000 // ms

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="w-full aspect-[16/9] bg-gray-200 rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-20 h-14 bg-gray-200 rounded-lg flex-shrink-0" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PropertyImageSlideshow({ listingId }: { listingId: string }) {
  const [images, setImages] = useState<ListingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Fetch images ──────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listing_images')
      .select('url, alt_text, is_cover, sort_order')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setImages(data ?? [])
        setLoading(false)
      })
  }, [listingId])

  // ── Navigation helpers ────────────────────────────────────────────────────

  const goTo = useCallback((index: number) => {
    setActive(index)
    setProgress(0)
  }, [])

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + images.length) % images.length)
    setProgress(0)
  }, [images.length])

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length)
    setProgress(0)
  }, [images.length])

  // ── Auto-play + progress bar ──────────────────────────────────────────────

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  useEffect(() => {
    if (images.length <= 1 || paused) {
      clearTimers()
      return
    }

    setProgress(0)
    const tick = 50 // ms per progress tick
    const steps = AUTO_PLAY_DELAY / tick

    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / steps, 100))
    }, tick)

    intervalRef.current = setInterval(() => {
      setActive((i) => (i + 1) % images.length)
      setProgress(0)
    }, AUTO_PLAY_DELAY)

    return clearTimers
  }, [images.length, paused, active])

  // ── Keyboard support ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) return <Skeleton />

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400">
        <span className="text-5xl">🏠</span>
        <p className="text-sm">No images available</p>
      </div>
    )
  }

  const current = images[active]

  return (
    <div
      ref={containerRef}
      className="space-y-3 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Main image ── */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 group">

        {/* Image with fade transition */}
        {images.map((img, i) => (
          <img
            key={img.url + i}
            src={img.url}
            alt={img.alt_text}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}

        {/* Progress bar */}
        {images.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-white transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Alt text label */}
        {current.alt_text && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full max-w-xs text-center truncate">
              {current.alt_text}
            </span>
          </div>
        )}

        {/* Image counter */}
        <span className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
          {active + 1} / {images.length}
        </span>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${
                  i === active
                    ? 'bg-white w-5 h-2'
                    : 'bg-white/50 hover:bg-white/80 w-2 h-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white text-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white text-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === active
                  ? 'border-blue-500 opacity-100 scale-105'
                  : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
