import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Vedaansh'
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'

/**
 * Shared Premium Layout Wrapper
 */
const createLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7;">
  <div style="background-color: #f7f7f7; padding: 40px 10px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1b1e 0%, #2d2e32 100%); padding: 32px; text-align: center;">
        <div style="color: #c9a84c; font-size: 28px; font-weight: bold; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 12px;">
          <img src="${baseUrl}/veda-icon.png" width="32" height="32" style="display: block;" />
          ${appName}
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px; color: #1f2937;">
        ${content}
      </div>
      
      <!-- Footer -->
      <div style="padding: 32px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">© 2026 ${appName} · Professional Jyotiṣa Platform</p>
        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">Providing precise Vedic insights through ancient wisdom and modern technology.</p>
      </div>
    </div>
  </div>
</body>
</html>
`

export async function sendVerificationEmail(email: string, token: string) {
  const verifyLink = `${baseUrl}/verify-email?token=${token}`

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: `Verify your email — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">Welcome to ${appName}!</h2>
      <p style="font-size: 16px; color: #4b5563;">Thank you for joining our community of seekers. To ensure the security of your account, please verify your email address below.</p>
      
      <div style="margin: 32px 0;">
        <a href="${verifyLink}" 
           style="background-color: #c9a84c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af;">This link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.</p>
    `),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export async function sendWelcomeEmail(email: string, plan: string, expiresAt: Date) {
  const accountLink = `${baseUrl}/account`
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const expiryStr = expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: `Welcome to ${planLabel} Access — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0; text-align: center;">Subscription Activated! ✨</h2>
      <p style="font-size: 16px; color: #4b5563;">Your <strong>${planLabel}</strong> membership is now active. You have unlocked full access to professional grade divisional charts, advanced dashas, and precision calculations.</p>
      
      <div style="background: #fefcf5; border: 1px solid #f2e9d1; padding: 24px; border-radius: 12px; margin: 32px 0;">
        <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 14px; text-transform: uppercase;">Subscription Details</p>
        <div style="margin-top: 12px; font-size: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Tier:</span>
            <strong style="color: #c9a84c;">${planLabel}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Renewal Date:</span>
            <strong>${expiryStr}</strong>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${accountLink}" 
           style="background-color: #1a1b1e; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          Launch Dashboard
        </a>
      </div>

      <p style="font-size: 15px; color: #4b5563;">We're honored to assist you on your astrological journey.</p>
    `),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${baseUrl}/reset-password?token=${token}`

  return resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: [email],
    subject: `Reset your password — ${appName}`,
    html: createLayout(`
      <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
      <p style="font-size: 16px; color: #4b5563;">We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
      
      <div style="margin: 32px 0;">
        <a href="${resetLink}"
           style="background-color: #c9a84c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
          Reset My Password
        </a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af;">If you didn't request this change, you can safely ignore this email. Your password will remain the same.</p>
    `),
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}

export async function sendChartEmail(toEmail: string, chartName: string, htmlContent: string, senderName: string = appName) {
  return resend.emails.send({
    from: `${senderName} <${fromEmail}>`,
    to: [toEmail],
    subject: `Your Jyotish Master Dossier — ${chartName}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1b1e;">Hello,</h2>
        <p>Please find attached your professional <strong>Jyotish Master Dossier</strong> for <strong>${chartName}</strong>.</p>
        <p>This comprehensive report includes your Rashi and Navamsha charts, Vimshottari Dasha timeline, planetary strengths (Shadbala), and specialized Astro-Vastu insights.</p>
        <p style="margin-top: 30px;">Best regards,<br/><strong>${senderName}</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">Sent via Vedaansh Jyotish Platform.</p>
      </div>
    `,
    attachments: [
      {
        filename: `${chartName.replace(/[^a-z0-9]/gi, '_')}-jyotish.html`,
        content: Buffer.from(htmlContent).toString('base64'),
      }
    ]
  }).then(res => ({ success: !res.error, ...res }))
    .catch(err => ({ success: false, error: err }))
}
