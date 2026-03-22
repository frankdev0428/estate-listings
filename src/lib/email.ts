import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM    = process.env.RESEND_FROM    ?? 'RealEstate App <onboarding@resend.dev>'
const SITE    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const ADMIN   = process.env.ADMIN_EMAIL    ?? ''

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadEmailPayload {
  leadName:    string
  leadEmail:   string
  leadPhone:   string | null
  budget:      string | null
  timeline:    string | null
  cityName:    string | null
  agentName:   string | null
  agentEmail:  string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns false if Resend is not configured — emails skipped gracefully */
function isConfigured(): boolean {
  const key = process.env.RESEND_API_KEY ?? ''
  return key.length > 0 && !key.startsWith('re_your')
}

function row(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:6px 12px;color:#6b7280;font-size:14px;white-space:nowrap">${label}</td>
      <td style="padding:6px 12px;color:#111827;font-size:14px;font-weight:500">${value}</td>
    </tr>`
}

// ─── Confirmation to the lead ─────────────────────────────────────────────────

export async function sendLeadConfirmation(payload: LeadEmailPayload) {
  if (!isConfigured()) return

  const { leadName, leadEmail, agentName, cityName, budget, timeline } = payload

  await resend.emails.send({
    from:    FROM,
    to:      leadEmail,
    subject: `We've received your inquiry${cityName ? ` — ${cityName}` : ''}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:ui-sans-serif,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 40px">
            <p style="margin:0;color:#fff;font-size:22px;font-weight:700">RealEstate App</p>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px">We've got your request</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi ${leadName},</p>
            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">
              Thanks for reaching out${cityName ? ` about properties in <strong>${cityName}</strong>` : ''}.
              ${agentName
                ? `We've assigned <strong>${agentName}</strong> to your inquiry — they'll be in touch shortly.`
                : `One of our agents will review your inquiry and be in touch shortly.`
              }
            </p>

            <!-- Summary table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
              <tr><td colspan="2" style="padding:10px 12px;background:#f3f4f6;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Your Submission</td></tr>
              ${row('Name',     leadName)}
              ${row('Email',    leadEmail)}
              ${row('Phone',    payload.leadPhone)}
              ${row('City',     cityName)}
              ${row('Budget',   budget)}
              ${row('Timeline', timeline)}
              ${row('Agent',    agentName)}
            </table>

            <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.6">
              In the meantime, you can browse more listings on our site.
            </p>

            <a href="${SITE}/search"
              style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none">
              Browse Listings →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              You're receiving this because you submitted a contact form at
              <a href="${SITE}" style="color:#6b7280">${SITE}</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

// ─── Notification to the assigned agent ──────────────────────────────────────

export async function sendAgentNotification(payload: LeadEmailPayload) {
  if (!isConfigured()) return

  const { agentEmail, agentName, leadName, leadEmail, leadPhone, budget, timeline, cityName } = payload

  // Send to the agent AND admin (if configured)
  const toAddresses = [
    agentEmail,
    ADMIN && ADMIN !== agentEmail ? ADMIN : null,
  ].filter(Boolean) as string[]

  if (toAddresses.length === 0) return

  await resend.emails.send({
    from:    FROM,
    to:      toAddresses,
    subject: `New lead: ${leadName}${cityName ? ` in ${cityName}` : ''}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:ui-sans-serif,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#047857);padding:32px 40px">
            <p style="margin:0;color:#fff;font-size:22px;font-weight:700">New Lead 🏠</p>
            <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px">
              ${agentName ? `Assigned to ${agentName}` : 'Unassigned lead'}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px">
            <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6">
              A new lead has been submitted${cityName ? ` for <strong>${cityName}</strong>` : ''}.
              Here are the details:
            </p>

            <!-- Lead details -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;margin-bottom:24px">
              <tr><td colspan="2" style="padding:10px 12px;background:#dcfce7;font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:.05em">Lead Info</td></tr>
              ${row('Name',     leadName)}
              ${row('Email',    leadEmail)}
              ${row('Phone',    leadPhone)}
              ${row('City',     cityName)}
              ${row('Budget',   budget)}
              ${row('Timeline', timeline)}
            </table>

            <!-- Quick action buttons -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px">
                  <a href="mailto:${leadEmail}?subject=Re: Your home inquiry${cityName ? ` in ${cityName}` : ''}"
                    style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:11px 24px;border-radius:10px;text-decoration:none">
                    Reply by Email
                  </a>
                </td>
                ${leadPhone ? `
                <td>
                  <a href="tel:${leadPhone}"
                    style="display:inline-block;border:1px solid #e5e7eb;color:#374151;font-size:14px;font-weight:500;padding:11px 24px;border-radius:10px;text-decoration:none">
                    Call ${leadPhone}
                  </a>
                </td>` : ''}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              Manage leads in your
              <a href="${SITE}" style="color:#6b7280">RealEstate App dashboard</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
