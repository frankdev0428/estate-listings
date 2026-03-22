import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/LeadForm'

export default async function ContactPage() {
  const supabase = createClient()
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, state')
    .order('name')

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Get in Touch</h1>
        <p className="text-gray-500 mt-2">
          Tell us what you're looking for and we'll match you with the right agent.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <LeadForm cities={cities ?? []} />
      </div>
    </div>
  )
}
