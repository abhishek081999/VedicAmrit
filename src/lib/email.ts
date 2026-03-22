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
