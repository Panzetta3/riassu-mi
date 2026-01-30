import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000'

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate token expiration date (24 hours from now)
 */
export function getTokenExpiration(): Date {
  const expiration = new Date()
  expiration.setHours(expiration.getHours() + 24)
  return expiration
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  // Check if email is configured
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('='.repeat(60))
    console.log('EMAIL VERIFICATION (SMTP non configurato)')
    console.log('='.repeat(60))
    console.log(`Email: ${email}`)
    console.log(`Link di verifica: ${SITE_URL}/api/auth/verify?token=${token}`)
    console.log('='.repeat(60))
    return true // Return true to allow registration to proceed
  }

  const verificationUrl = `${SITE_URL}/api/auth/verify?token=${token}`

  const mailOptions = {
    from: `"Riassu.mi" <${SMTP_USER}>`,
    to: email,
    subject: 'Verifica il tuo account - Riassu.mi',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Riassu.mi</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Verifica il tuo account</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; margin-top: 0;">Ciao!</h2>

            <p>Grazie per esserti registrato su Riassu.mi. Per completare la registrazione e iniziare a creare riassunti intelligenti, clicca sul pulsante qui sotto:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Verifica Email
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
              <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">

            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
              Questo link scade tra 24 ore. Se non hai richiesto questa email, puoi ignorarla.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Verifica il tuo account Riassu.mi

Ciao! Grazie per esserti registrato su Riassu.mi.

Per completare la registrazione, visita questo link:
${verificationUrl}

Il link scade tra 24 ore.

Se non hai richiesto questa email, puoi ignorarla.
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS)
}
