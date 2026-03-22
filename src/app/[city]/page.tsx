import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import AgentCard from '@/components/AgentCard'
import LeadForm from '@/components/LeadForm'
import Link from 'next/link'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugToName(slug: string) {
  return decodeURIComponent(slug)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Static params (build-time pre-rendering) ────────────────────────────────

export async function generateStaticParams() {
  // Must use static client — cookies() cannot be called at build time
  const supabase = createStaticClient()
  const { data: cities } = await supabase.from('cities').select('name')
  return (cities ?? []).map((c) => ({
    city: c.name.toLowerCase().replace(/\s+/g, '-'),
  }))
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city: citySlug } = await params
  const cityName = slugToName(citySlug)

  const title = `Best First-Time Home Buyer Agents in ${cityName}`
  const description = `Find the best first-time home buyer agents in ${cityName}. Our local experts guide you through every step — pre-approval, home search, offers, and closing. Free to connect, no experience needed.`

  return {
    title,
    description,
    keywords: [
      `best first-time home buyer agents in ${cityName}`,
      `first time home buyer agent ${cityName}`,
      `first time buyer realtor ${cityName}`,
      `${cityName} first time home buyer help`,
      `best real estate agents ${cityName}`,
      `how to buy a home in ${cityName}`,
      `${cityName} home buying guide`,
    ],
    alternates: {
      canonical: `/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${citySlug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ city: string }>
}

export default async function CityLandingPage({ params }: Props) {
  const { city: citySlug } = await params
  const cityName = slugToName(citySlug)

  const supabase = createClient()

  // Match city by name (case-insensitive)
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, state, listing_count')

  const city = (cities ?? []).find(
    (c) => c.name.toLowerCase().replace(/\s+/g, '-') === citySlug.toLowerCase(),
  )

  if (!city) notFound()

  // Fetch active agents in this city
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, email, phone, avatar_url, bio, specialties, rating, listings_sold')
    .eq('city_id', city.id)
    .eq('is_active', true)
    .order('rating', { ascending: false })

  const allCities = (cities ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    state: c.state,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* ── Breadcrumb ── */}
      <nav className="text-sm text-gray-400 mb-8 flex gap-2 items-center">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cities" className="hover:text-blue-600 transition-colors">Cities</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{city.name}</span>
      </nav>

      {/* ── Hero ── */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          Real Estate Agents in{' '}
          <span className="text-blue-600">{city.name}</span>
        </h1>
        <p className="text-gray-500 text-lg mt-3 max-w-2xl">
          Browse {agents?.length ?? 0} local agents ready to help you find your home in{' '}
          {city.name}, {city.state} — specializing in first-time buyers.
        </p>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 mt-6">
          <Stat label="Active Listings" value={city.listing_count.toString()} />
          <Stat label="Local Agents" value={(agents?.length ?? 0).toString()} />
          <Stat label="Avg. Rating" value={
            agents && agents.length > 0
              ? (agents.reduce((s, a) => s + a.rating, 0) / agents.length).toFixed(1)
              : '—'
          } />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* ── Agent list ── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Agent cards */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Available Agents in {city.name}
            </h2>
            {agents && agents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    id={agent.id}
                    name={agent.name}
                    email={agent.email}
                    phone={agent.phone}
                    avatar_url={agent.avatar_url}
                    city={city.name}
                    state={city.state}
                    bio={agent.bio}
                    specialties={agent.specialties}
                    rating={agent.rating}
                    listings_sold={agent.listings_sold}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl text-gray-400">
                No agents listed in {city.name} yet.
              </div>
            )}
          </section>

          {/* ── SEO: First-time buyer guide ── */}
          <section className="prose prose-gray prose-sm max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 not-prose mb-4">
              First-Time Buyer Guide: {city.name}, {city.state}
            </h2>

            <div className="space-y-6 text-gray-600 leading-relaxed">
              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  Why buy in {city.name}?
                </h3>
                <p>
                  {city.name} is one of the most sought-after markets in {city.state}, offering
                  a mix of established neighborhoods, new developments, and strong long-term
                  appreciation. Whether you're looking for a starter condo or a family home,
                  {' '}{city.name} has options across every budget range.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  What to expect as a first-time buyer
                </h3>
                <p>
                  Buying your first home can feel overwhelming, but our agents in {city.name}
                  {' '}specialize in walking first-time buyers through every step — from getting
                  pre-approved to closing day. You don't need any prior experience; your agent
                  handles the negotiations, paperwork, and inspections on your behalf.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  Steps to buying your first home in {city.name}
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {[
                    'Get pre-approved for a mortgage to understand your budget.',
                    `Connect with a local ${city.name} agent who knows the neighborhoods.`,
                    'Tour homes and identify must-haves vs. nice-to-haves.',
                    'Make an offer — your agent will advise on competitive pricing.',
                    'Complete inspections and negotiate repairs if needed.',
                    'Close and get your keys!',
                  ].map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  First-time buyer programs in {city.state}
                </h3>
                <p>
                  Many first-time buyers in {city.state} qualify for down payment assistance,
                  FHA loans (3.5% down), or state-specific programs. Ask your agent about
                  local grants and programs — you may be eligible for thousands in assistance.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">
                  How to choose the right agent in {city.name}
                </h3>
                <p>
                  Look for an agent who has sold homes in your target neighborhood, communicates
                  clearly, and has a track record with first-time buyers. All agents listed
                  above are active in {city.name} and rated by past clients.
                </p>
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {faqItems(city.name, city.state).map((faq) => (
                <details key={faq.q} className="group p-5 cursor-pointer">
                  <summary className="font-medium text-gray-900 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* ── Sticky lead form ── */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Talk to an Agent in {city.name}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Free, no commitment — get matched in minutes.
            </p>
            <LeadForm cities={allCities} defaultCityId={city.id} />
          </div>
        </aside>
      </div>

    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}

function faqItems(city: string, state: string) {
  return [
    {
      q: `How much does it cost to buy a home in ${city}?`,
      a: `Home prices in ${city} vary by neighborhood and property type. Your agent will provide a comparative market analysis to help you understand current pricing and identify the best value for your budget.`,
    },
    {
      q: 'Do I need a large down payment as a first-time buyer?',
      a: `Not necessarily. FHA loans allow as little as 3.5% down, and ${state} may offer additional down payment assistance programs for qualifying buyers. Your agent can connect you with mortgage specialists who know these programs.`,
    },
    {
      q: `How long does it take to buy a home in ${city}?`,
      a: 'From pre-approval to closing, most purchases take 30–60 days once you have an accepted offer. The search phase varies — some buyers find a home in weeks, others take a few months.',
    },
    {
      q: 'What does a buyer\'s agent cost me?',
      a: 'In most cases, nothing out of pocket. The seller traditionally covers the buyer\'s agent commission, so you get expert representation at no direct cost to you.',
    },
    {
      q: `Is ${city} a good market for first-time buyers right now?`,
      a: `${city} remains a competitive market with strong long-term fundamentals. Your agent will help you time your offers and identify neighborhoods with the best value for first-time buyers.`,
    },
  ]
}
