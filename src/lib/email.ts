import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendVerificationEmail(email: string, token: string) {
  const verifyLink = `${baseUrl}/verify-email?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: `Vedaansh <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: 'Verify your email address',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c9a84c;">🪐 Welcome to Vedaansh</h2>
          <p>Thank you for signing up! Please verify your email address to get started.</p>
          <div style="margin: 20px 0;">
            <a href="${verifyLink}" 
               style="background-color: #c9a84c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 0.8rem;">If you didn't create an account, you can ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 0.7rem;">© 2026 Vedaansh</p>
        </div>
      `,
    })

    if (error) {
      console.error('[email] resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[email] unexpected error:', err)
    return { success: false, error: err }
  }
}
export async function sendWelcomeEmail(email: string, plan: string, expiresAt: Date) {
  const accountLink = `${baseUrl}/account`
  const planLabel  = plan.charAt(0).toUpperCase() + plan.slice(1)
  const expiryStr  = expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  try {
    const { data, error } = await resend.emails.send({
      from: `Vedaansh <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: `🪐 Welcome to ${planLabel}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #c9a84c; text-align: center;">Welcome to ${planLabel}!</h1>
          <p>Thank you for choosing Vedaansh. Your subscription has been activated successfully.</p>
          
          <div style="background: #fdfaf3; border: 1px solid #f2e9d1; padding: 20px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 0; font-weight: bold; color: #c9a84c;">🎯 Your Subscription Details</p>
            <ul style="list-style: none; padding: 0; margin: 15px 0 0 0;">
              <li>Plan: <strong>${planLabel}</strong></li>
              <li>Renew date: <strong>${expiryStr}</strong></li>
            </ul>
          </div>

          <p>You now have full access to all ${planLabel} features, including advanced vargas, unlimited saves, and precise dasha periods.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountLink}" 
               style="background-color: #c9a84c; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">
              Go to My Account
            </a>
          </div>

          <p style="font-size: 0.9rem; color: #666;">Namaste,<br>The Vedaansh Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 0.75rem; text-align: center;">© 2026 Vedaansh · Professional Jyotiṣa Platform</p>
        </div>
      `,
    })

    if (error) {
      console.error('[email/welcome] resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[email/welcome] unexpected error:', err)
    return { success: false, error: err }
  }
}
