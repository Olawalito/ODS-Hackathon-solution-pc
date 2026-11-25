import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function requireRole(role: 'student' | 'lecturer') {
  const user = await getCurrentUser()
  if (!user) return { response: NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 }) }
  if (user.role !== role) return { response: NextResponse.json({ error: 'You do not have permission to do that.' }, { status: 403 }) }
  return { user }
}
export function apiError(error: unknown) {
  console.error('[BITMARK API]', error)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
