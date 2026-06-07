import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { to } = await req.json()

    if (!to) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

    if (!accountSid || !authToken || !serviceSid) {
      console.error('Twilio Verify credentials missing in .env')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)

    let formattedTo = to.trim()
    if (!formattedTo.startsWith('+')) {
      formattedTo = '+34' + formattedTo // Default to Spain if no code
    }

    const verification = await client.verify.v2.services(serviceSid).verifications.create({
      to: formattedTo,
      channel: 'sms'
    })

    return NextResponse.json({ success: true, status: verification.status })
  } catch (error: any) {
    console.error('Twilio Verify Send Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 })
  }
}
