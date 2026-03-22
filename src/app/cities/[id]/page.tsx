import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CityPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: city } = await supabase
    .from('cities')
    .select('*')
    .eq('id', id)
    .single()

  if (!city) notFound()

  const { data: listings } = await supabase
    .from('listings')
    .select('*, agents(name, avatar_url)')
    .eq('city_id', id)
    .order('created_at', { ascending: false })

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('city_id', id)
    .order('rating', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* City Header */}
      <div className="mb-10">
        <Link href="/cities" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          &larr; Back to Cities
        </Link>
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{city.name}</h1>
            <p className="text-gray-500 text-lg">{city.state}</p>
          </div>
          <span className="bg-blue-50 text-blue-700 font-medium px-4 py-1.5 rounded-full mb-1">
            {city.listing_count} listings
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Listings */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Properties</h2>
          {listings && listings.length > 0 ? (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{listing.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">{listing.address}</p>
                    </div>
                    <p className="text-blue-600 font-bold text-xl">
                      ${listing.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <span>🛏 {listing.bedrooms} beds</span>
                    <span>🚿 {listing.bathrooms} baths</span>
                    <span>📐 {listing.sqft.toLocaleString()} sqft</span>
                  </div>
                  {listing.description && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p>No listings in this city yet.</p>
            </div>
          )}
        </div>

        {/* Agents in this city */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Local Agents</h2>
          {agents && agents.length > 0 ? (
            <div className="space-y-4">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                      ) : '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{agent.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-yellow-400">★</span>
                        <span>{agent.rating.toFixed(1)}</span>
                        <span>·</span>
                        <span>{agent.listings_sold} sales</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <p>No agents in this city yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
