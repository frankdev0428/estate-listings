'use client'

import Link from 'next/link'

export type AgentCardProps = {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  city?: string | null
  state?: string | null
  bio?: string | null
  specialties?: string[] | null
  rating?: number
  listings_sold?: number
}

export default function AgentCard({
  id,
  name,
  email,
  phone,
  avatar_url,
  city,
  state,
  bio,
  specialties,
  rating,
  listings_sold,
}: AgentCardProps) {
  const location = [city, state].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Top section */}
      <div className="p-6 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0 ring-2 ring-blue-50">
          {avatar_url ? (
            <img src={avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="select-none">👤</span>
          )}
        </div>

        {/* Name + location + rating */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/agents/${id}`}
            className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors leading-tight line-clamp-1"
          >
            {name}
          </Link>

          {location && (
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-sm">
            {rating !== undefined && (
              <span className="flex items-center gap-0.5 text-yellow-500 font-medium">
                ★ {rating.toFixed(1)}
              </span>
            )}
            {listings_sold !== undefined && (
              <span className="text-gray-400">{listings_sold} sold</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="px-6 text-sm text-gray-600 line-clamp-2 -mt-2">{bio}</p>
      )}

      {/* Specialties */}
      {specialties && specialties.length > 0 && (
        <div className="px-6 mt-4 flex flex-wrap gap-2">
          {specialties.map((s) => (
            <span
              key={s}
              className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Divider + CTA */}
      <div className="mt-auto pt-5 px-6 pb-6">
        <div className="border-t border-gray-100 pt-4 flex gap-3">
          <a
            href={`mailto:${email}`}
            className="flex-1 bg-blue-600 text-white text-sm font-semibold text-center px-4 py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            Contact Agent
          </a>
          {phone && (
            <a
              href={`tel:${phone}`}
              aria-label="Call agent"
              className="border border-gray-200 text-gray-600 px-3 py-2.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5S9.5 12 12 14.5s4 3.5 4 3.5l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0124 18.72V22a2 2 0 01-2 2h-1C9.716 24 0 14.284 0 3V2a2 2 0 012-2h1z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
