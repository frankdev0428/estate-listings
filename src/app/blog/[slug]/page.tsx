import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/server'
import BlogCard from '@/components/BlogCard'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, image_url')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.image_url ? [post.image_url] : [],
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const supabase = createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  // Related posts — same category, exclude current
  const { data: related } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex gap-2 items-center">
        <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            {post.category}
          </span>
          {post.tags?.map((tag: string) => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>

        {post.excerpt && (
          <p className="text-xl text-gray-500 mt-3 leading-relaxed">{post.excerpt}</p>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-lg flex-shrink-0">
            {post.author_avatar
              ? <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
              : '✍️'}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{post.author_name}</p>
            {date && <p className="text-gray-400 text-xs">{date}</p>}
          </div>
        </div>
      </header>

      {/* Cover image */}
      {post.image_url && (
        <div className="rounded-2xl overflow-hidden mb-10 h-80 bg-gray-100">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Body */}
      <article
        className="prose prose-gray prose-lg max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-p:text-gray-600 prose-p:leading-relaxed
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-800
          prose-ul:text-gray-600 prose-ol:text-gray-600
          prose-blockquote:border-blue-400 prose-blockquote:text-gray-500"
      >
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>

      {/* CTA */}
      <div className="mt-14 bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to find your home?</h2>
        <p className="text-gray-500 text-sm mb-5">
          Connect with a local agent who specializes in first-time buyers.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Talk to an Agent
        </Link>
      </div>

      {/* Related posts */}
      {related && related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((r) => (
              <BlogCard
                key={r.id}
                slug={r.slug}
                title={r.title}
                excerpt={r.excerpt}
                image_url={r.image_url}
                category={r.category}
                author_name={r.author_name}
                author_avatar={r.author_avatar}
                published_at={r.published_at}
              />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link href="/blog" className="text-blue-600 hover:underline text-sm">
          ← Back to Blog
        </Link>
      </div>
    </div>
  )
}
