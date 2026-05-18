import { createBrowserClient } from '@supabase/ssr'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const supabaseReady = Boolean(rawUrl && rawKey && !rawUrl.includes("your-project-id"))

export const supabase = createBrowserClient(
  rawUrl,
  rawKey
)

/**
 * Compatibility export — returns the singleton supabase instance.
 * Used by features like cloudsave and dashboard.
 */
export const createClient = () => supabase


