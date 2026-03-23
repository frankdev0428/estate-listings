import Link from 'next/link'

type Props = {
  slug: string
  title: string
  excerpt?: string | null
  image_url?: string | null
  category: string
  author_name: string
  author_avatar?: string | null
  published_at?: string | null
}

export default function BlogCard({
  slug, title, excerpt, image_url, category, author_name, author_avatar, published_at,
}: Props) {
  const date = published_at
    ? new Date(published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <Link href={`/blog/${slug}`}>
      <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all h-full flex flex-col cursor-pointer">
        {/* Cover */}
        <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 h-48 flex-shrink-0 overflow-hidden">
          {image_url ? (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">📝</div>
          )}
          <span className="absolute top-3 left-3 bg-white text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow">
            {category}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
          {excerpt && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-2 flex-1">{excerpt}</p>
          )}

          {/* Author + date */}
          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-gray-100">
            <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs">
              {author_avatar
                ? <img src={author_avatar} alt={author_name} className="w-full h-full object-cover" />
                : '✍️'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{author_name}</p>
              {date && <p className="text-xs text-gray-400">{date}</p>}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
