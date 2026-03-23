import { createClient } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentRow = {
  id: string
  name: string
  email: string
  phone: string | null
  bio: string | null
  avatar_url: string | null
  city_id: string | null
  city_name: string | null
  city_state: string | null
  listings_sold: number
  rating: number
}

export type LeadInsert = {
  name: string
  email: string
  phone?: string
  message?: string
  budget?: string
  timeline?: string
  city_id?: string
  agent_id?: string
  source?: string
}

export type LeadRow = LeadInsert & {
  id: string
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'
  created_at: string
}

// ─── Agents ───────────────────────────────────────────────────────────────────

/**
 * Fetch all active agents for a given city.
 * Calls the `get_agents_by_city` Postgres function.
 */
export async function getAgentsByCity(cityId: string): Promise<AgentRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .rpc('get_agents_by_city', { p_city_id: cityId })

  if (error) throw new Error(`getAgentsByCity: ${error.message}`)
  return data ?? []
}

/**
 * Fetch a single agent by ID with their city details.
 */
export async function getAgentById(agentId: string): Promise<AgentRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('agents')
    .select('*, cities(name, state)')
    .eq('id', agentId)
    .single()

  if (error) return null
  if (!data) return null

  const row = data as unknown as { cities: { name: string; state: string } | null } & AgentRow
  return {
    ...row,
    city_name: row.cities?.name ?? null,
    city_state: row.cities?.state ?? null,
  }
}

// ─── Leads ────────────────────────────────────────────────────────────────────

/**
 * Insert a new lead.
 * Calls the `insert_lead` Postgres function.
 */
export async function insertLead(lead: LeadInsert): Promise<LeadRow> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('insert_lead', {
    p_name:     lead.name,
    p_email:    lead.email,
    p_phone:    lead.phone     ?? null,
    p_message:  lead.message   ?? null,
    p_budget:   lead.budget    ?? null,
    p_timeline: lead.timeline  ?? null,
    p_city_id:  lead.city_id   ?? null,
    p_agent_id: lead.agent_id  ?? null,
    p_source:   lead.source    ?? 'website',
  })

  if (error) throw new Error(`insertLead: ${error.message}`)
  return data as LeadRow
}

// ─── Cities ───────────────────────────────────────────────────────────────────

/**
 * Fetch all cities ordered by listing count.
 */
export async function getCities() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('listing_count', { ascending: false })

  if (error) throw new Error(`getCities: ${error.message}`)
  return data ?? []
}

/**
 * Fetch a single city by ID.
 */
export async function getCityById(cityId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .single()

  if (error) return null
  return data
}
