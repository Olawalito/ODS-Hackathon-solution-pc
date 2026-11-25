import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { COOKIE_NAME, issueToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Check the information and try again.' }, { status: 400 })
    const data = parsed.data

    if (data.role === 'lecturer') {
      const expectedCode = process.env.LECTURER_SIGNUP_CODE
      const submittedCode = data.lecturerSignupCode ?? ''
      const expectedBuffer = Buffer.from(expectedCode ?? '')
      const submittedBuffer = Buffer.from(submittedCode)
      if (expectedBuffer.length < 24) return NextResponse.json({ error: 'Lecturer sign-up is not configured. Contact your BITMARK administrator.' }, { status: 503 })
      if (expectedBuffer.length !== submittedBuffer.length || !timingSafeEqual(expectedBuffer, submittedBuffer)) return NextResponse.json({ error: 'Lecturer invitation code is incorrect.' }, { status: 403 })
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1)
    if (existing) return NextResponse.json({ error: 'An account with those details already exists.' }, { status: 409 })

    if (data.matricNumber) {
      const [matric] = await db.select({ id: users.id }).from(users).where(eq(users.matricNumber, data.matricNumber)).limit(1)
      if (matric) return NextResponse.json({ error: 'An account with those details already exists.' }, { status: 409 })
    }

    const user = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: await hash(data.password, 12),
      role: data.role,
      matricNumber: data.role === 'student' ? data.matricNumber || null : null,
      faceDescriptor: data.role === 'student' ? data.faceDescriptor : null,
    }

    await db.insert(users).values(user)
    const token = await issueToken(user)
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
    response.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error('[BITMARK register]', error)
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 })
  }
}
