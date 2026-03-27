'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type ListingImage = {
  url: string
  alt_text: string
  is_cover: boolean
  sort_order: number
}

const AUTO_PLAY_DELAY = 5000

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

export default function PropertyImageSlideshow({ listingId }: { listingId: string }) {
  const [images, setImages]   = useState<ListingImage[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused]   = useState(false)
  const [zoomed, setZoomed]   = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [fade, setFade]       = useState(true)
  const [lightbox, setLightbox] = useState(false)

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listing_images')
      .select('url, alt_text, is_cover, sort_order')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { setImages(data ?? []); setLoading(false) })
  }, [listingId])

  // ── Navigate with fade ──────────────────────────────────────
  const goTo = useCallback((index: number) => {
    setFade(false)
    setTimeout(() => { setActive(index); setProgress(0); setFade(true) }, 180)
  }, [])

  const prev = useCallback(() => goTo((active - 1 + images.length) % images.length), [active, images.length, goTo])
  const next = useCallback(() => goTo((active + 1) % images.length), [active, images.length, goTo])

  // ── Auto-play + progress ────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current)  clearInterval(intervalRef.current)
    if (progressRef.current)  clearInterval(progressRef.current)
    if (images.length <= 1 || paused || lightbox) return

    setProgress(0)
    const tick  = 50
    const steps = AUTO_PLAY_DELAY / tick

    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / steps, 100))
    }, tick)

    intervalRef.current = setInterval(() => {
      setActive((i) => {
        const n = (i + 1) % images.length
        setFade(false)
        setTimeout(() => { setActive(n); setFade(true) }, 180)
        return i
      })
      setProgress(0)
    }, AUTO_PLAY_DELAY)

    return () => {
      if (intervalRef.current)  clearInterval(intervalRef.current)
      if (progressRef.current)  clearInterval(progressRef.current)
    }
  }, [images.length, paused, active, lightbox])

  // ── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     { setLightbox(false); setZoomed(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (loading) return <Skeleton />

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400">
        <span className="text-6xl select-none">🏠</span>
        <p className="text-sm">No photos available</p>
      </div>
    )
  }

  const current = images[active]

  return (
    <>
      <div
        className="space-y-3 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ── Main image ─────────────────────────────────── */}
        <div
          className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-900 group ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setZoomed((z) => !z)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            })
          }}
          onMouseLeave={() => setZoomed(false)}
        >
          {/* Stacked images for cross-fade */}
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt_text}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-opacity duration-500 ease-in-out
                ${i === active ? (fade ? 'opacity-100' : 'opacity-0') : 'opacity-0'}
              `}
              style={{
                transform: zoomed && i === active ? 'scale(2.2)' : 'scale(1)',
                transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                transition: zoomed
                  ? 'transform 0.3s ease, opacity 0.5s ease'
                  : 'transform 0.4s ease, opacity 0.5s ease',
              }}
              draggable={false}
            />
          ))}

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Top gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Progress bar */}
          {images.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20 pointer-events-none">
              <div
                className="h-full bg-blue-400 transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Counter + expand button */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {active + 1} / {images.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(true) }}
              aria-label="View fullscreen"
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
              </svg>
            </button>
          </div>

          {/* Cover badge */}
          {current.is_cover && (
            <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Cover
            </div>
          )}

          {/* Alt text label */}
          {current.alt_text && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full max-w-sm text-center truncate">
                {current.alt_text}
              </span>
            </div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i) }}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${
                    i === active ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Previous"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Next"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* ── Thumbnail strip ─────────────────────────────── */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`View photo ${i + 1}`}
                className={`
                  flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${i === active
                    ? 'border-blue-500 opacity-100 shadow-lg shadow-blue-200 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-90 hover:scale-105'}
                `}
              >
                <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>

          {/* Image */}
          <img
            src={current.url}
            alt={current.alt_text}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Alt text */}
          {current.alt_text && (
            <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center">
              {current.alt_text}
            </p>
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Previous"
                className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Next"
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i) }}
                  className={`flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                    i === active ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
