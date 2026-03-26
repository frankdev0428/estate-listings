import { createClient } from '@/lib/supabase/server'

export default async function CommentList({ postId }: { postId: string }) {
  const supabase = createClient()
  const { data: comments } = await supabase
    .from('comments')
    .select('id, name, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (!comments || comments.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        No comments yet. Be the first to share your thoughts!
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {comments.map((c) => {
        const date = new Date(c.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
        return (
          <div key={c.id} className="flex gap-4">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                <span className="text-gray-400 text-xs">{date}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{c.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
