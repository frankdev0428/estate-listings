import { createClient } from '@/lib/supabase/server'
import AgentCard from '@/components/AgentCard'

export default async function AgentsPage() {
  const supabase = createClient()
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
          {agents.map((agent) => {
            const city = agent.cities as any
            return (
              <AgentCard
                key={agent.id}
                id={agent.id}
                name={agent.name}
                email={agent.email}
                phone={agent.phone}
                avatar_url={agent.avatar_url}
                city={city?.name ?? null}
                state={city?.state ?? null}
                bio={agent.bio}
                specialties={agent.specialties ?? null}
                rating={agent.rating}
                listings_sold={agent.listings_sold}
              />
            )
          })}
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
