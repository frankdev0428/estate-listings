/**
 * Cookie-free Supabase client for use in generateStaticParams / generateMetadata.
 * cookies() from next/headers cannot be called outside a request scope (build time),
 * so we use the plain JS client here instead of the SSR one.
 */
import { createClient } from '@supabase/supabase-js'

export function createStaticClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
