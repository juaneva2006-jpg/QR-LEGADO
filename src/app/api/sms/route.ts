import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: Request) {
  try {
    const { to, body } = await req.json()

    if (!to || !body) {
      return NextResponse.json({ error: 'Missing phone number or message body' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromPhone = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromPhone) {
      console.error('Twilio credentials missing in .env')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const client = twilio(accountSid, authToken)

    // Formatear el número (asegurarse de que lleva el + si es español, pero por defecto Twilio asume E.164)
    // Si no tiene prefijo internacional, añadimos el de España temporalmente si es necesario
    let formattedTo = to.trim()
    if (!formattedTo.startsWith('+')) {
      formattedTo = '+34' + formattedTo // Asumiendo España por defecto
    }

    const message = await client.messages.create({
      body,
      from: fromPhone,
      to: formattedTo
    })

    return NextResponse.json({ success: true, messageSid: message.sid })
  } catch (error: any) {
    console.error('Twilio Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 })
  }
}
