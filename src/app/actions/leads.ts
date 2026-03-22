'use server'

import { createClient } from '@/lib/supabase/server'

export type LeadFormState =
  | { status: 'idle' }
  | { status: 'success'; agentName: string | null }
  | { status: 'error'; message: string }

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const name     = formData.get('name')     as string
  const email    = formData.get('email')    as string
  const phone    = formData.get('phone')    as string | null
  const budget   = formData.get('budget')   as string | null
  const timeline = formData.get('timeline') as string | null
  const cityId   = formData.get('city_id')  as string | null
  const agentId  = formData.get('agent_id') as string | null

  if (!name?.trim() || !email?.trim()) {
    return { status: 'error', message: 'Name and email are required.' }
  }

  const supabase = await createClient()

  // Auto-assign agent: prefer explicit selection, else pick highest-rated in city
  let resolvedAgentId = agentId || null

  if (!resolvedAgentId && cityId) {
    const { data: assigned } = await supabase
      .rpc('assign_agent_for_city', { p_city_id: cityId })
    resolvedAgentId = assigned ?? null
  }

  const { error } = await supabase.rpc('insert_lead', {
    p_name:     name.trim(),
    p_email:    email.trim(),
    p_phone:    phone    || null,
    p_message:  null,
    p_budget:   budget   || null,
    p_timeline: timeline || null,
    p_city_id:  cityId   || null,
    p_agent_id: resolvedAgentId,
    p_source:   'lead-form',
  })

  if (error) {
    console.error('submitLead error:', error)
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }

  // Resolve the assigned agent's name for the success message
  let agentName: string | null = null
  if (resolvedAgentId) {
    const { data: agent } = await supabase
      .from('agents')
      .select('name')
      .eq('id', resolvedAgentId)
      .single()
    agentName = agent?.name ?? null
  }

  return { status: 'success', agentName }
}
