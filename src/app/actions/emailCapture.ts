'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribeEmail(
  email: string,
  source: 'sticky' | 'listing' | 'exit_popup',
  listingId?: string
): Promise<{ success: boolean; message: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email.' }
  }

  const supabase = createClient()
  const { error } = await supabase.from('email_subscriptions').insert({
    email,
    source,
    listing_id: listingId ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: true, message: "You're already subscribed!" }
    }
    return { success: false, message: 'Something went wrong. Try again.' }
  }

  return { success: true, message: "You're in! We'll send new listings your way." }
}
