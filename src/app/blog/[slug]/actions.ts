'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CommentState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function submitComment(
  postId: string,
  slug: string,
  _prev: CommentState,
  formData: FormData
): Promise<CommentState> {
  const name = formData.get('name')?.toString().trim()
  const email = formData.get('email')?.toString().trim() || null
  const body = formData.get('body')?.toString().trim()

  if (!name || !body) {
    return { status: 'error', message: 'Name and comment are required.' }
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, name, email, body })

  if (error) {
    return { status: 'error', message: 'Failed to submit comment. Please try again.' }
  }

  revalidatePath(`/blog/${slug}`)
  return { status: 'success', message: 'Comment submitted!' }
}
