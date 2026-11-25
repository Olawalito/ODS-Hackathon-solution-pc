import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { courses, sessions } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'

const schema = z.object({ title: z.string().trim().min(2).max(120), radiusMeters: z.number().int().min(10).max(1000).default(50), lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180) })
function code() { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }
export async function GET(_request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await requireRole('lecturer'); if (auth.response) return auth.response
  const { courseId } = await params
  const [course] = await db.select({ id: courses.id }).from(courses).where(and(eq(courses.id, courseId), eq(courses.lecturerId, auth.user.id))).limit(1)
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
  const rows = await db.select().from(sessions).where(eq(sessions.courseId, courseId)).orderBy(desc(sessions.startsAt))
  return NextResponse.json({ sessions: rows })
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const auth = await requireRole('lecturer'); if (auth.response) return auth.response
  const { courseId } = await params
  const [course] = await db.select({ id: courses.id }).from(courses).where(and(eq(courses.id, courseId), eq(courses.lecturerId, auth.user.id))).limit(1)
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a session title and allow location access.' }, { status: 400 })
  for (let attempt = 0; attempt < 4; attempt++) {
    const item = { id: randomUUID(), courseId, ...parsed.data, code: code(), expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), isActive: true }
    try { await db.insert(sessions).values(item); return NextResponse.json({ session: item }, { status: 201 }) } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === '23505')) throw error
    }
  }
  return NextResponse.json({ error: 'Could not create a unique class code. Try again.' }, { status: 500 })
}
