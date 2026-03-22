'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export type City = { id: string; name: string; state: string }

const PRICE_RANGES = [
  { label: 'Any Price',     min: '',       max: '' },
  { label: 'Under $300k',   min: '',       max: '300000' },
  { label: '$300k – $500k', min: '300000', max: '500000' },
  { label: '$500k – $750k', min: '500000', max: '750000' },
  { label: '$750k – $1M',   min: '750000', max: '1000000' },
  { label: '$1M – $2M',     min: '1000000',max: '2000000' },
  { label: 'Over $2M',      min: '2000000',max: '' },
]

const BED_OPTIONS   = ['Any', '1+', '2+', '3+', '4+', '5+']
const TYPE_OPTIONS  = ['Any Type', 'House', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Other']
const SORT_OPTIONS  = [
  { label: 'Newest',       value: 'newest' },
  { label: 'Price ↑',     value: 'price_asc' },
  { label: 'Price ↓',     value: 'price_desc' },
  { label: 'Most Beds',   value: 'beds_desc' },
]

interface Props {
  cities: City[]
  /** Compact = single-row hero bar; default = stacked sidebar/page style */
  compact?: boolean
}

export default function SearchFilters({ cities, compact = false }: Props) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const get = (key: string) => searchParams.get(key) ?? ''

  // Derive active price range label from min/max params
  const activePriceKey = `${get('minPrice')}|${get('maxPrice')}`
  const activePriceLabel = PRICE_RANGES.find(
    (r) => `${r.min}|${r.max}` === activePriceKey
  )?.label ?? 'Any Price'

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else    params.delete(k)
      })
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handlePrice = (label: string) => {
    const range = PRICE_RANGES.find((r) => r.label === label)
    if (!range) return
    push({ minPrice: range.min, maxPrice: range.max })
  }

  const handleBeds = (val: string) =>
    push({ beds: val === 'Any' ? '' : val.replace('+', '') })

  const handleType = (val: string) =>
    push({ type: val === 'Any Type' ? '' : val })

  const handleCity = (val: string) =>
    push({ city: val })

  const handleSort = (val: string) =>
    push({ sort: val })

  const handleQ = (val: string) =>
    push({ q: val })

  const activeCity = get('city')
  const activeBeds = get('beds') ? `${get('beds')}+` : 'Any'
  const activeType = get('type') || 'Any Type'
  const activeSort = get('sort') || 'newest'
  const activeQ    = get('q')

  const hasFilters =
    !!get('city') || !!get('minPrice') || !!get('beds') || !!get('type')

  if (compact) {
    // ── Hero bar (single row, white card) ──────────────────────────────────
    return (
      <div className="bg-white rounded-2xl shadow-xl p-3 flex flex-col sm:flex-row gap-2 w-full max-w-3xl mx-auto">
        {/* City */}
        <select
          value={activeCity}
          onChange={(e) => handleCity(e.target.value)}
          className={selectCls + ' flex-1'}
          aria-label="City"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.state}
            </option>
          ))}
        </select>

        {/* Price */}
        <select
          value={activePriceLabel}
          onChange={(e) => handlePrice(e.target.value)}
          className={selectCls + ' flex-1'}
          aria-label="Price range"
        >
          {PRICE_RANGES.map((r) => (
            <option key={r.label}>{r.label}</option>
          ))}
        </select>

        {/* Beds */}
        <select
          value={activeBeds}
          onChange={(e) => handleBeds(e.target.value)}
          className={selectCls}
          aria-label="Bedrooms"
        >
          {BED_OPTIONS.map((b) => (
            <option key={b}>{b === 'Any' ? 'Any Beds' : `${b} Beds`}</option>
          ))}
        </select>

        {/* Type */}
        <select
          value={activeType}
          onChange={(e) => handleType(e.target.value)}
          className={selectCls}
          aria-label="Property type"
        >
          {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
        </select>

        <button
          onClick={() => router.push('/search')}
          className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
        >
          Search
        </button>
      </div>
    )
  }

  // ── Full filter bar (search page) ──────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      {/* Keyword */}
      <div>
        <label className={labelCls}>Keyword</label>
        <input
          type="text"
          placeholder="Search by title or address…"
          defaultValue={activeQ}
          onChange={(e) => handleQ(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* City */}
      <div>
        <label className={labelCls}>City</label>
        <select
          value={activeCity}
          onChange={(e) => handleCity(e.target.value)}
          className={inputCls}
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.state}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className={labelCls}>Price Range</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {PRICE_RANGES.filter((r) => r.label !== 'Any Price').map((r) => {
            const active = `${r.min}|${r.max}` === activePriceKey
            return (
              <button
                key={r.label}
                onClick={() => handlePrice(active ? 'Any Price' : r.label)}
                className={`text-sm py-1.5 px-3 rounded-lg border transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className={labelCls}>Bedrooms</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {BED_OPTIONS.map((b) => {
            const active = activeBeds === b || (b === 'Any' && activeBeds === 'Any')
            return (
              <button
                key={b}
                onClick={() => handleBeds(b)}
                className={`text-sm py-1.5 px-3 rounded-lg border transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {b === 'Any' ? 'Any' : `${b} Beds`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Property type */}
      <div>
        <label className={labelCls}>Property Type</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {TYPE_OPTIONS.map((t) => {
            const active = activeType === t
            return (
              <button
                key={t}
                onClick={() => handleType(t)}
                className={`text-sm py-1.5 px-3 rounded-lg border transition-all text-left ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className={labelCls}>Sort By</label>
        <select
          value={activeSort}
          onChange={(e) => handleSort(e.target.value)}
          className={inputCls}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => router.push('/search')}
          className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors py-1"
        >
          ✕ Clear all filters
        </button>
      )}
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const selectCls =
  'bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const inputCls =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'
