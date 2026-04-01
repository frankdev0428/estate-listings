'use client'

import { useState, useEffect, useRef } from 'react'
import { subscribeEmail } from '@/app/actions/emailCapture'

export default function ExitIntentPopup() {
  const [visible, setVisible]   = useState(false)
  const [email, setEmail]       = useState('')
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage]   = useState('')
  const firedRef                = useRef(false)

  useEffect(() => {
    const STORAGE_KEY = 'exit_popup_dismissed'
    if (sessionStorage.getItem(STORAGE_KEY)) return

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 10 && !firedRef.current) {
        firedRef.current = true
        setVisible(true)
      }
    }

    // Small delay so it doesn't fire too quickly on page load
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }, 3000)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem('exit_popup_dismissed', '1')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await subscribeEmail(email, 'exit_popup')
    setStatus(res.success ? 'success' : 'error')
    setMessage(res.message)
    if (res.success) {
      sessionStorage.setItem('exit_popup_dismissed', '1')
      setTimeout(dismiss, 2500)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-8 pt-8 pb-6 text-white text-center">
          <div className="text-4xl mb-3">🏡</div>
          <h2 className="text-2xl font-bold leading-tight">
            Before you go —
          </h2>
          <p className="text-blue-100 mt-1 text-sm">
            Get new Bay Area listings before everyone else
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <ul className="space-y-2 mb-6">
            {[
              'New homes emailed the day they list',
              'Price drops on properties you love',
              'Off-market deals in your area',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          {status === 'success' ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-semibold text-gray-900">{message}</p>
              <p className="text-gray-400 text-sm mt-1">Check your inbox soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm"
              >
                {status === 'loading' ? 'Subscribing...' : 'Yes, send me listings →'}
              </button>
              {status === 'error' && (
                <p className="text-red-500 text-xs text-center">{message}</p>
              )}
            </form>
          )}

          <button
            onClick={dismiss}
            className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            No thanks, I&apos;ll miss out
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-lg"
        >
          ×
        </button>
      </div>
    </div>
  )
}
