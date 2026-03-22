import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchFilters from '@/components/SearchFilters'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Search and filter homes by city, price, bedrooms, and property type.',
}

interface SearchParams {
  city?: string
  minPrice?: string
  maxPrice?: string
  beds?: string
  type?: string
  sort?: string
  q?: string
}

interface Props {
  searchParams: SearchParams
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = createClient()

  // ── Fetch cities for the filter bar ──────────────────────────────────────
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, state')
    .order('name')

  // ── Build the listings query from searchParams ────────────────────────────
  let query = supabase
    .from('listings')
    .select('id, title, price, address, bedrooms, bathrooms, sqft, image_url, property_type, city_id, cities(name, state)')

  if (searchParams.city)
    query = query.eq('city_id', searchParams.city)

  if (searchParams.minPrice)
    query = query.gte('price', parseInt(searchParams.minPrice))

  if (searchParams.maxPrice)
    query = query.lte('price', parseInt(searchParams.maxPrice))

  if (searchParams.beds)
    query = query.gte('bedrooms', parseInt(searchParams.beds))

  if (searchParams.type)
    query = query.eq('property_type', searchParams.type)

  if (searchParams.q) {
    const q = searchParams.q.trim()
    query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%`)
  }

  // Sort
  switch (searchParams.sort) {
    case 'price_asc':  query = query.order('price', { ascending: true });  break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'beds_desc':  query = query.order('bedrooms', { ascending: false }); break
    default:           query = query.order('created_at', { ascending: false })
  }

  const { data: listings, error } = await query.limit(48)

  const totalCount = listings?.length ?? 0
  const hasFilters = !!(
    searchParams.city || searchParams.minPrice ||
    searchParams.beds || searchParams.type || searchParams.q
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {hasFilters ? 'Search Results' : 'All Properties'}
        </h1>
        <p className="text-gray-500 mt-1">
          {totalCount === 0
            ? 'No properties match your filters'
            : `${totalCount} propert${totalCount === 1 ? 'y' : 'ies'} found`}
          {searchParams.q && (
            <span className="ml-1">for <strong>"{searchParams.q}"</strong></span>
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Sidebar filters ── */}
        <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24 self-start">
          <Suspense>
            <SearchFilters cities={cities ?? []} />
          </Suspense>
        </aside>

        {/* ── Results grid ── */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
              Error loading listings. Please check your Supabase connection.
            </div>
          )}

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((listing) => {
                const city = listing.cities as { name: string; state: string } | null
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <article className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white">
                      {/* Photo */}
                      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-4xl select-none">🏠</span>
                        )}
                        {listing.property_type && (
                          <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                            {listing.property_type}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <p className="text-xl font-bold text-blue-600">
                          ${listing.price.toLocaleString()}
                        </p>
                        <h2 className="font-semibold text-gray-900 mt-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {listing.title}
                        </h2>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1 flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                          </svg>
                          {listing.address}
                          {city && `, ${city.name}`}
                        </p>

                        {/* Specs */}
                        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
                          <span className="flex items-center gap-1">
                            <span>🛏</span> {listing.bedrooms}
                          </span>
                          <span className="text-gray-200">|</span>
                          <span className="flex items-center gap-1">
                            <span>🚿</span> {listing.bathrooms}
                          </span>
                          <span className="text-gray-200">|</span>
                          <span className="flex items-center gap-1">
                            <span>📐</span> {listing.sqft.toLocaleString()} sqft
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          ) : (
            !error && <EmptyState hasFilters={hasFilters} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-200 rounded-2xl">
      <span className="text-6xl mb-4">🏠</span>
      <p className="text-xl font-semibold text-gray-700">No properties found</p>
      <p className="text-gray-400 text-sm mt-2 max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters — broaden the price range or remove a filter.'
          : 'No listings have been added yet. Add properties in your Supabase table.'}
      </p>
      {hasFilters && (
        <Link
          href="/search"
          className="mt-5 text-sm text-blue-600 hover:underline font-medium"
        >
          Clear all filters →
        </Link>
      )}
    </div>
  )
}
