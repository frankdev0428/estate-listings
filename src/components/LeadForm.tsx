'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { submitLead, type LeadFormState } from '@/app/actions/leads'
import { createClient } from '@/lib/supabase/client'

type City = { id: string; name: string; state: string }
type Agent = { id: string; name: string; rating: number }

const BUDGET_OPTIONS = [
  'Under $250k',
  '$250k – $500k',
  '$500k – $750k',
  '$750k – $1M',
  '$1M – $2M',
  'Over $2M',
]

const TIMELINE_OPTIONS = [
  'ASAP',
  'Within 1 month',
  '1 – 3 months',
  '3 – 6 months',
  '6 – 12 months',
  'Just exploring',
]

const initialState: LeadFormState = { status: 'idle' }

type Props = {
  cities: City[]
  /** Pre-select a city (e.g. from city page) */
  defaultCityId?: string
  /** Pre-select an agent (e.g. from agent profile) */
  defaultAgentId?: string
}

export default function LeadForm({ cities, defaultCityId, defaultAgentId }: Props) {
  const [state, action] = useFormState(submitLead, initialState)

  const [selectedCityId, setSelectedCityId] = useState(defaultCityId ?? '')
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)

  // Fetch agents when city changes
  useEffect(() => {
    if (!selectedCityId) {
      setAgents([])
      return
    }
    setAgentsLoading(true)
    const supabase = createClient()
    supabase
      .from('agents')
      .select('id, name, rating')
      .eq('city_id', selectedCityId)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .then(({ data }) => {
        setAgents(data ?? [])
        setAgentsLoading(false)
      })
  }, [selectedCityId])

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-1">You're all set!</h3>
        <p className="text-green-700 text-sm">
          {state.agentName
            ? <>Your inquiry has been assigned to <strong>{state.agentName}</strong>. They'll be in touch shortly.</>
            : 'Your inquiry was submitted. An agent will reach out soon.'}
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input
            name="name"
            type="text"
            placeholder="Jane Smith"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Email" required>
          <input
            name="email"
            type="email"
            placeholder="jane@email.com"
            required
            className={inputCls}
          />
        </Field>
      </div>

      {/* Phone + Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <input
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            className={inputCls}
          />
        </Field>
        <Field label="Budget" required>
          <select name="budget" required className={inputCls} defaultValue="">
            <option value="" disabled>Select range</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* City + Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="City" required>
          <select
            name="city_id"
            required
            className={inputCls}
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
          >
            <option value="" disabled>Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Timeline" required>
          <select name="timeline" required className={inputCls} defaultValue="">
            <option value="" disabled>When are you looking?</option>
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Preferred Agent (optional, loads after city pick) */}
      {selectedCityId && (
        <Field
          label={
            agentsLoading
              ? 'Preferred Agent (loading…)'
              : agents.length > 0
                ? 'Preferred Agent (optional)'
                : 'Preferred Agent'
          }
        >
          <select
            name="agent_id"
            className={inputCls}
            defaultValue={defaultAgentId ?? ''}
            disabled={agentsLoading || agents.length === 0}
          >
            <option value="">Auto-assign (recommended)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — ★ {a.rating.toFixed(1)}
              </option>
            ))}
          </select>
          {!agentsLoading && agents.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No agents available in this city yet.</p>
          )}
        </Field>
      )}

      {/* Error banner */}
      {state.status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {state.message}
        </p>
      )}

      {/* Submit */}
      <SubmitButton />

      <p className="text-xs text-center text-gray-400">
        Your information is private and will only be shared with your assigned agent.
      </p>
    </form>
  )
}

// ─── Submit button (needs useFormStatus, must be its own component) ──────────

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Submitting…' : 'Contact an Agent'}
    </button>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400'

function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
