import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '@/lib/jwt'

export { issueToken, verifyToken } from '@/lib/jwt'
export type { AppRole } from '@/lib/jwt'
export const COOKIE_NAME = 'bitmark_session'
export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, matricNumber: users.matricNumber }).from(users).where(eq(users.id, payload.id)).limit(1)
  if (!user || user.role !== payload.role) return null
  return user
}
