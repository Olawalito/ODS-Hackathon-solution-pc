import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attendance, courses, sessions, users } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const auth = await requireRole('lecturer'); if (auth.response) return auth.response
  const { studentId } = await params
  const [student] = await db.select({ id: users.id, name: users.name, matricNumber: users.matricNumber }).from(users).where(and(eq(users.id, studentId), eq(users.role, 'student'))).limit(1)
  if (!student) return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
  const ownedCourses = await db.select({ id: courses.id, code: courses.code, title: courses.title }).from(courses).where(eq(courses.lecturerId, auth.user.id))
  const courseIds = ownedCourses.map((course) => course.id)
  const held = courseIds.length ? await db.select({ id: sessions.id, title: sessions.title, code: sessions.code, startsAt: sessions.startsAt, courseId: sessions.courseId }).from(sessions).where(inArray(sessions.courseId, courseIds)) : []
  const attended = held.length ? await db.select({ sessionId: attendance.sessionId, status: attendance.status, createdAt: attendance.createdAt }).from(attendance).where(and(eq(attendance.studentId, studentId), inArray(attendance.sessionId, held.map((session) => session.id)))) : []
  const attendanceMap = new Map(attended.map((row) => [row.sessionId, row]))
  const courseMap = new Map(ownedCourses.map((course) => [course.id, course]))
  const list = held.map((session) => ({ ...session, course: courseMap.get(session.courseId), attended: attendanceMap.has(session.id), markedAt: attendanceMap.get(session.id)?.createdAt ?? null }))
  const total = held.length
  const count = attended.length
  return NextResponse.json({ student, total, count, percentage: total ? Math.round((count / total) * 100) : 0, sessions: list })
}
