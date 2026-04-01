'use client'

import { useState } from 'react'
import { subscribeEmail } from '@/app/actions/emailCapture'

export default function StickyEmailBar() {
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await subscribeEmail(email, 'sticky')
    setStatus(res.success ? 'success' : 'error')
    setMessage(res.message)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-2xl border-t border-blue-500">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xl">🏡</span>
          <div>
            <p className="font-semibold text-sm leading-tight">Get new listings in your area</p>
            <p className="text-blue-200 text-xs">Fresh Bay Area homes, before they&apos;re gone</p>
          </div>
        </div>

        {status === 'success' ? (
          <p className="text-sm font-medium text-blue-100 bg-blue-800/50 px-4 py-2 rounded-lg">
            ✓ {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 sm:w-64 px-4 py-2 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors disabled:opacity-60 flex-shrink-0"
            >
              {status === 'loading' ? '...' : 'Notify Me'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-300 text-xs absolute bottom-14 right-4">{message}</p>
        )}

        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute top-2 right-3 text-blue-300 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
