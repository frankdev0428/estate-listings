import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { id: string }
}

export default async function AgentProfilePage({ params }: Props) {
  const { id } = params
  const supabase = createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('*, cities(name, state)')
    .eq('id', id)
    .single()

  if (!agent) notFound()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/agents" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
        &larr; Back to Agents
      </Link>

      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-10 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl overflow-hidden flex-shrink-0">
            {agent.avatar_url ? (
              <Image src={agent.avatar_url} alt={agent.name} fill className="object-cover" />
            ) : '👤'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            {agent.cities && (
              <p className="text-gray-500 mt-1">
                {(agent.cities as { name: string; state: string }).name}, {(agent.cities as { name: string; state: string }).state}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-gray-700">{agent.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">rating</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
                <span className="font-semibold text-blue-700">{agent.listings_sold}</span>
                <span className="text-blue-600 text-sm">listings sold</span>
              </div>
            </div>
          </div>
        </div>

        {agent.bio && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-600 leading-relaxed">{agent.bio}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📧 Email Agent
            </a>
          )}
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              📞 {agent.phone}
            </a>
          )}
        </div>
      </div>

      {/* Agent's Listings */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Listings by {agent.name}
          {listings && listings.length > 0 && (
            <span className="text-gray-400 font-normal text-lg ml-2">({listings.length})</span>
          )}
        </h2>

        {listings && listings.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center">
                    {listing.image_url ? (
                      <Image src={listing.image_url} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <span className="text-4xl">🏠</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{listing.title}</h3>
                      <p className="text-blue-600 font-bold">${listing.price.toLocaleString()}</p>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{listing.address}</p>
                    <div className="flex gap-3 mt-3 text-sm text-gray-600">
                      <span>🛏 {listing.bedrooms}</span>
                      <span>🚿 {listing.bathrooms}</span>
                      <span>📐 {listing.sqft.toLocaleString()} sqft</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <p>No active listings by this agent.</p>
          </div>
        )}
      </div>
    </div>
  )
}
