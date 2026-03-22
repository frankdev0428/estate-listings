import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PhotoGallery from '@/components/PhotoGallery'

interface Props {
  params: { id: string }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('listings')
    .select('title, price, address, description')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Listing Not Found' }

  return {
    title: `${data.title} — $${data.price.toLocaleString()}`,
    description:
      data.description ??
      `${data.title} at ${data.address}. Listed at $${data.price.toLocaleString()}.`,
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ListingPage({ params }: Props) {
  const supabase = createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      cities ( id, name, state ),
      agents ( id, name, email, phone, avatar_url, bio, rating, listings_sold, specialties )
    `)
    .eq('id', params.id)
    .single()

  if (!listing) notFound()

  const city   = listing.cities  as { id: string; name: string; state: string } | null
  const agent  = listing.agents  as {
    id: string; name: string; email: string; phone: string | null
    avatar_url: string | null; bio: string | null
    rating: number; listings_sold: number; specialties: string[]
  } | null

  // Combine image_url + images array, deduplicated
  const allPhotos = [
    ...(listing.image_url ? [listing.image_url] : []),
    ...(listing.images ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  const pricePerSqft =
    listing.sqft > 0 ? Math.round(listing.price / listing.sqft) : null

  // Related listings in same city (excluding this one)
  const { data: related } = await supabase
    .from('listings')
    .select('id, title, price, bedrooms, bathrooms, sqft, image_url, address')
    .eq('city_id', listing.city_id)
    .neq('id', listing.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex flex-wrap gap-1.5 items-center">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>/</span>
        {city && (
          <>
            <Link href={`/${city.name.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-blue-600 transition-colors">
              {city.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-700 font-medium line-clamp-1">{listing.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-10">

        {/* ── Left column: photos + details ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Photo gallery */}
          <PhotoGallery images={allPhotos} title={listing.title} />

          {/* Title + price */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.address}
                {city && `, ${city.name}, ${city.state}`}
              </p>
            </div>
            <div className="sm:text-right flex-shrink-0">
              <p className="text-3xl font-bold text-blue-600">
                ${listing.price.toLocaleString()}
              </p>
              {pricePerSqft && (
                <p className="text-sm text-gray-400 mt-0.5">${pricePerSqft.toLocaleString()}/sqft</p>
              )}
            </div>
          </div>

          {/* Specs bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SpecCard icon="🛏" label="Bedrooms"  value={listing.bedrooms.toString()} />
            <SpecCard icon="🚿" label="Bathrooms" value={listing.bathrooms.toString()} />
            <SpecCard icon="📐" label="Sq. Ft."   value={listing.sqft.toLocaleString()} />
            <SpecCard icon="🏠" label="Type"       value={listing.property_type ?? 'House'} />
          </div>

          {/* Additional details */}
          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            <DetailRow label="Property Type" value={listing.property_type ?? 'House'} />
            {listing.year_built && (
              <DetailRow label="Year Built" value={listing.year_built.toString()} />
            )}
            <DetailRow label="Parking" value={listing.parking > 0 ? `${listing.parking} space${listing.parking > 1 ? 's' : ''}` : 'None'} />
            <DetailRow
              label="HOA Fee"
              value={listing.hoa_fee != null ? `$${listing.hoa_fee.toLocaleString()}/mo` : 'None'}
            />
            {city && (
              <DetailRow label="City" value={`${city.name}, ${city.state}`} />
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">About This Property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </section>
          )}

          {/* Related listings */}
          {related && related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                More in {city?.name ?? 'This Area'}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link key={r.id} href={`/listings/${r.id}`}>
                    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 flex items-center justify-center">
                        {r.image_url
                          ? <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                          : <span className="text-3xl">🏠</span>
                        }
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{r.title}</p>
                        <p className="text-blue-600 font-bold text-sm mt-0.5">
                          ${r.price.toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {r.bedrooms}bd · {r.bathrooms}ba · {r.sqft.toLocaleString()} sqft
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Right column: agent card + CTA ── */}
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">

          {/* Agent card */}
          {agent && (
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Listed by
              </p>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                  {agent.avatar_url
                    ? <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                    : '👤'
                  }
                </div>
                <div>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {agent.name}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <span className="text-yellow-400">★</span>
                    <span>{agent.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{agent.listings_sold} sold</span>
                  </div>
                </div>
              </div>

              {agent.bio && (
                <p className="text-sm text-gray-500 mt-4 line-clamp-3">{agent.bio}</p>
              )}

              {agent.specialties && agent.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {agent.specialties.map((s) => (
                    <span key={s} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-3">
                <a
                  href={`mailto:${agent.email}?subject=Inquiry: ${encodeURIComponent(listing.title)}&body=Hi ${encodeURIComponent(agent.name)},%0A%0AI'm interested in the property at ${encodeURIComponent(listing.address)}.%0A%0APlease get in touch.`}
                  className="w-full bg-blue-600 text-white text-sm font-semibold text-center py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                  Email Agent
                </a>
                {agent.phone && (
                  <a
                    href={`tel:${agent.phone}`}
                    className="w-full border border-gray-200 text-gray-700 text-sm font-semibold text-center py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    {agent.phone}
                  </a>
                )}
                <Link
                  href={`/agents/${agent.id}`}
                  className="text-center text-sm text-blue-600 hover:underline"
                >
                  View agent profile →
                </Link>
              </div>
            </div>
          )}

          {/* Share / save bar */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-white text-sm text-gray-500 text-center">
            <p className="font-medium text-gray-700 mb-3">Share this listing</p>
            <div className="flex justify-center gap-3">
              <CopyLinkButton />
            </div>
          </div>

          {/* Price breakdown */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-white space-y-3">
            <p className="font-semibold text-gray-900 text-sm">Estimated Monthly Cost</p>
            <MortgageEstimate price={listing.price} hoaFee={listing.hoa_fee} />
          </div>
        </aside>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpecCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center">
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-3.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function MortgageEstimate({ price, hoaFee }: { price: number; hoaFee: number | null }) {
  // Simple estimate: 20% down, 7% APR, 30yr
  const principal = price * 0.8
  const monthlyRate = 0.07 / 12
  const payments = 360
  const mortgage = Math.round(
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, payments))) /
    (Math.pow(1 + monthlyRate, payments) - 1)
  )
  const tax = Math.round(price * 0.012 / 12)   // ~1.2% annual property tax
  const insurance = Math.round(price * 0.005 / 12) // ~0.5% annual

  const rows = [
    { label: 'Mortgage (20% down, 7%, 30yr)', value: mortgage },
    { label: 'Property Tax (est.)', value: tax },
    { label: 'Insurance (est.)', value: insurance },
    ...(hoaFee ? [{ label: 'HOA Fee', value: hoaFee }] : []),
  ]
  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-2 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-gray-600">
          <span>{r.label}</span>
          <span>${r.value.toLocaleString()}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
        <span>Total / month</span>
        <span>${total.toLocaleString()}</span>
      </div>
      <p className="text-xs text-gray-400">Estimate only. Contact a lender for exact figures.</p>
    </div>
  )
}

// Minimal client component for copy link — kept isolated so the page stays a server component
import CopyLinkButton from '@/components/CopyLinkButton'
