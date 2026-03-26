import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CitiesPage() {
  const supabase = createClient()
  const { data: cities, error } = await supabase
    .from('cities')
    .select('*')
    .order('name')

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
    <div className="citiesComponent">
    </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Cities</h1>
      <p className="text-gray-500 mb-10">Find properties in your preferred city.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-sm">
          Error loading cities. Please check your Supabase connection.
        </div>
      )}

      {cities && cities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Link key={city.id} href={`/cities/${city.id}`}>
              <div className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 h-48 flex items-center justify-center">
                  {city.image_url ? (
                    <img src={city.image_url} alt={city.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🏙️</span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {city.name}
                  </h2>
                  <p className="text-gray-500">{city.state}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                      {city.listing_count} listings
                    </span>
                    <span className="text-blue-600 text-sm font-medium group-hover:underline">
                      View &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">🏙️</div>
          <p className="text-xl font-medium text-gray-500">No cities found</p>
          <p className="text-sm mt-2">Add cities to your Supabase database to get started.</p>
        </div>
      )}
    </div>
  )
}
