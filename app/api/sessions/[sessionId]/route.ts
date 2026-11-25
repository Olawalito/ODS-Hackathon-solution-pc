import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attendance, courses, sessions, users } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await requireRole('lecturer'); if (auth.response) return auth.response
  const { sessionId } = await params
  const [owned] = await db.select({ id: sessions.id }).from(sessions).innerJoin(courses, eq(sessions.courseId, courses.id)).where(and(eq(sessions.id, sessionId), eq(courses.lecturerId, auth.user.id))).limit(1)
  if (!owned) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  const records = await db.select({ id: attendance.id, studentId: attendance.studentId, name: users.name, matricNumber: users.matricNumber, distanceMeters: attendance.distanceMeters, createdAt: attendance.createdAt, status: attendance.status }).from(attendance).innerJoin(users, eq(attendance.studentId, users.id)).where(eq(attendance.sessionId, sessionId)).orderBy(attendance.createdAt)
  return NextResponse.json({ attendance: records, total: records.length })
}
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = await requireRole('lecturer'); if (auth.response) return auth.response
  const { sessionId } = await params
  const [owned] = await db.select({ id: sessions.id }).from(sessions).innerJoin(courses, eq(sessions.courseId, courses.id)).where(and(eq(sessions.id, sessionId), eq(courses.lecturerId, auth.user.id))).limit(1)
  if (!owned) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  await db.update(sessions).set({ isActive: false }).where(eq(sessions.id, sessionId))
  return NextResponse.json({ ok: true })
}
