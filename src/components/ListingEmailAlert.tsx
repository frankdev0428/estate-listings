'use client'

import { useState } from 'react'
import { subscribeEmail } from '@/app/actions/emailCapture'

export default function ListingEmailAlert({ listingId }: { listingId: string }) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await subscribeEmail(email, 'listing', listingId)
    setStatus(res.success ? 'success' : 'error')
    setMessage(res.message)
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xl">
          🔔
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base">Want similar homes?</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            Get alerts the moment new listings like this hit the market.
          </p>

          {status === 'success' ? (
            <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-medium">
              <span>✓</span> {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 flex-shrink-0"
              >
                {status === 'loading' ? '...' : 'Get Alerts →'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-red-500 text-xs mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
