import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { to, code } = await req.json()

    if (!to || !code) {
      return NextResponse.json({ error: 'Missing phone number or code' }, { status: 400 })
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
      formattedTo = '+34' + formattedTo
    }

    const verificationCheck = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to: formattedTo,
      code: code
    })

    if (verificationCheck.status === 'approved') {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Twilio Verify Check Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 500 })
  }
}
