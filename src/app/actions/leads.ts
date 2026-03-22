'use server'

import { createClient } from '@/lib/supabase/server'
import { sendLeadConfirmation, sendAgentNotification } from '@/lib/email'

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

  const supabase = createClient()

  // Auto-assign agent: prefer explicit selection, else pick highest-rated in city
  let resolvedAgentId = agentId || null
  if (!resolvedAgentId && cityId) {
    const { data: assigned } = await supabase
      .rpc('assign_agent_for_city', { p_city_id: cityId })
    resolvedAgentId = assigned ?? null
  }

  // ── Insert lead into Supabase ────────────────────────────────────────────
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

  // ── Resolve agent + city details for emails ──────────────────────────────
  const [agentResult, cityResult] = await Promise.all([
    resolvedAgentId
      ? supabase.from('agents').select('name, email').eq('id', resolvedAgentId).single()
      : Promise.resolve({ data: null }),
    cityId
      ? supabase.from('cities').select('name').eq('id', cityId).single()
      : Promise.resolve({ data: null }),
  ])

  const agentName  = agentResult.data?.name  ?? null
  const agentEmail = agentResult.data?.email ?? null
  const cityName   = cityResult.data?.name   ?? null

  const emailPayload = {
    leadName:   name.trim(),
    leadEmail:  email.trim(),
    leadPhone:  phone   || null,
    budget:     budget  || null,
    timeline:   timeline || null,
    cityName,
    agentName,
    agentEmail,
  }

  // ── Send emails in parallel, non-blocking to the response ───────────────
  await Promise.allSettled([
    sendLeadConfirmation(emailPayload),
    sendAgentNotification(emailPayload),
  ])

  return { status: 'success', agentName }
}
