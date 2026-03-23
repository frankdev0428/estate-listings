import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BlogCard from '@/components/BlogCard'

export const metadata: Metadata = {
  title: 'Blog — Real Estate Tips & Guides',
  description: 'Expert advice for first-time home buyers, market insights, and real estate tips from our team.',
}

const CATEGORIES = ['All', 'First-Time Buyers', 'Market Trends', 'Tips & Advice', 'Neighborhoods', 'Finance']

interface Props {
  searchParams: { category?: string }
}

export default async function BlogPage({ searchParams }: Props) {
  const activeCategory = searchParams.category ?? 'All'
  const supabase = createClient()

  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (activeCategory !== 'All') {
    query = query.eq('category', activeCategory)
  }

  const { data: posts, error } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Real Estate Blog</h1>
        <p className="text-gray-500 mt-2 text-lg max-w-xl mx-auto">
          Tips, guides, and market insights to help you buy smarter.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={cat === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </a>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-sm text-center">
          Error loading posts. Please check your Supabase connection.
        </div>
      )}

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      ) : (
        <div className="text-center py-24 text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-xl font-medium text-gray-500">No posts yet</p>
          <p className="text-sm mt-2">
            {activeCategory !== 'All'
              ? `No posts in "${activeCategory}" yet.`
              : 'Add posts to your Supabase database to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
