import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { COOKIE_NAME, issueToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 })
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1)
    if (!user || !(await compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 })
    const token = await issueToken({ id: user.id, role: user.role as 'student' | 'lecturer' })
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
    response.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error('[BITMARK login]', error)
    return NextResponse.json({ error: 'Could not sign in. Please try again.' }, { status: 500 })
  }
}
