import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*, cities(name, state)')
    .order('rating', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Agents</h1>
      <p className="text-gray-500 mb-10">Connect with experienced real estate professionals.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-sm">
          Error loading agents. Please check your Supabase connection.
        </div>
      )}

      {agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <div className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                    ) : '👤'}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {agent.name}
                    </h2>
                    {agent.cities && (
                      <p className="text-gray-500 text-sm">
                        {(agent.cities as any).name}, {(agent.cities as any).state}
                      </p>
                    )}
                  </div>
                </div>
                {agent.bio && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{agent.bio}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-gray-700">{agent.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-500">{agent.listings_sold} listings sold</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-xl font-medium text-gray-500">No agents found</p>
          <p className="text-sm mt-2">Add agents to your Supabase database to get started.</p>
        </div>
      )}
    </div>
  )
}
