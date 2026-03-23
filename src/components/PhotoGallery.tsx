'use client'

import { useState } from 'react'

interface Props {
  images: string[]   // all photo URLs (hero first)
  title: string
}

export default function PhotoGallery({ images, title }: Props) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <span className="text-7xl select-none">🏠</span>
      </div>
    )
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length)
  const next = () => setActive((i) => (i + 1) % images.length)

  return (
    <div className="space-y-3">
      {/* Main photo */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 group">
        <img
          src={images[active]}
          alt={`${title} — photo ${active + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {images.length > 1 && (
          <>
            {/* Prev */}
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ‹
            </button>
            {/* Next */}
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ›
            </button>
            {/* Counter */}
            <span className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails — only shown when there are multiple photos */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === active
                  ? 'border-blue-500 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
