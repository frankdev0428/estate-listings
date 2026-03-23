import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import SearchFilters from '@/components/SearchFilters'
import ListingCard from '@/components/ListingCard'
import BlogCard from '@/components/BlogCard'

export default async function HomePage() {
  const supabase = createClient()

  const [{ data: cities }, { data: agents }, { data: allCities }, { data: featuredListings }, { data: posts }] = await Promise.all([
    supabase.from('cities').select('*').order('listing_count', { ascending: false }).limit(6),
    supabase.from('agents').select('*').order('rating', { ascending: false }).limit(3),
    supabase.from('cities').select('id, name, state').order('name'),
    supabase.from('listings').select('*, agents(name, avatar_url)').order('created_at', { ascending: false }).limit(8),
    supabase.from('posts').select('*').eq('published', true).order('published_at', { ascending: false }).limit(3),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Find Your Dream Home</h1>
          <p className="text-xl text-blue-100 mb-8">
            Browse listings across top cities with expert agents ready to help.
          </p>
          <Suspense>
            <SearchFilters cities={allCities ?? []} compact />
          </Suspense>
          <div className="flex gap-5 justify-center mt-5 text-sm text-blue-200">
            <Link href="/cities" className="hover:text-white transition-colors">Browse Cities →</Link>
            <Link href="/agents" className="hover:text-white transition-colors">Find an Agent →</Link>
          </div>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Top Cities</h2>
          <Link href="/cities" className="text-blue-600 hover:underline font-medium">
            View all &rarr;
          </Link>
        </div>
        {cities && cities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Link key={city.id} href={`/cities/${city.id}`}>
                <div className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-40 flex items-center justify-center">
                    {city.image_url ? (
                      <img src={city.image_url} alt={city.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🏙️</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {city.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{city.state}</p>
                    <p className="text-blue-600 text-sm font-medium mt-1">
                      {city.listing_count} listings
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No cities yet. Connect Supabase to get started.</p>
          </div>
        )}
      </section>

      {/* Featured Listings */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Latest Listings</h2>
              <p className="text-gray-500 text-sm mt-1">Freshly added properties across all cities</p>
            </div>
            <Link href="/search" className="text-blue-600 hover:underline font-medium">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                address={listing.address}
                price={listing.price}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                sqft={listing.sqft}
                image_url={listing.image_url}
                property_type={listing.property_type}
                agent={listing.agents as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* Blog Preview */}
      {posts && posts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">From the Blog</h2>
                <p className="text-gray-500 text-sm mt-1">Tips and guides for home buyers</p>
              </div>
              <Link href="/blog" className="text-blue-600 hover:underline font-medium">
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  image_url={post.image_url}
                  category={post.category}
                  author_name={post.author_name}
                  author_avatar={post.author_avatar}
                  published_at={post.published_at}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Agents */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Agents</h2>
            <Link href="/agents" className="text-blue-600 hover:underline font-medium">
              View all &rarr;
            </Link>
          </div>
          {agents && agents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow text-center cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center text-2xl overflow-hidden">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{agent.listings_sold} sales</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium text-gray-700">{agent.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No agents yet. Connect Supabase to get started.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
