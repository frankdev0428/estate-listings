'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitComment, type CommentState } from '@/app/blog/[slug]/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Posting...' : 'Post Comment'}
    </button>
  )
}

export default function CommentForm({ postId, slug }: { postId: string; slug: string }) {
  const initial: CommentState = { status: 'idle' }
  const action = submitComment.bind(null, postId, slug)
  const [state, formAction] = useFormState(action, initial)

  if (state.status === 'success') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center text-green-700 font-medium">
        Thanks for your comment! It has been posted.
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {state.message}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Your name"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comment <span className="text-red-500">*</span>
        </label>
        <textarea
          name="body"
          required
          rows={4}
          placeholder="Share your thoughts..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
