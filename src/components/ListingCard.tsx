import Link from 'next/link'
import Image from 'next/image'

type Props = {
  id: string
  title: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  image_url?: string | null
  property_type?: string | null
  agent?: { name: string; avatar_url?: string | null } | null
}

export default function ListingCard({
  id, title, address, price, bedrooms, bathrooms, sqft, image_url, property_type, agent,
}: Props) {
  return (
    <Link href={`/listings/${id}`}>
      <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex-shrink-0">
          {image_url ? (
            <Image src={image_url} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
          )}
          {property_type && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {property_type}
            </span>
          )}
          <span className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            ${price.toLocaleString()}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{address}</p>

          {/* Specs */}
          <div className="flex gap-3 mt-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <BedIcon /> {bedrooms} bd
            </span>
            <span className="flex items-center gap-1">
              <BathIcon /> {bathrooms} ba
            </span>
            <span className="flex items-center gap-1">
              <SqftIcon /> {sqft.toLocaleString()} ft²
            </span>
          </div>

          {/* Agent */}
          {agent && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="relative w-6 h-6 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs">
                {agent.avatar_url
                  ? <Image src={agent.avatar_url} alt={agent.name} fill className="object-cover" />
                  : '👤'}
              </div>
              <span className="text-xs text-gray-500 truncate">{agent.name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function BedIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" /></svg>
}
function BathIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16v4a4 4 0 01-4 4H8a4 4 0 01-4-4v-4z" /></svg>
}
function SqftIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
}
