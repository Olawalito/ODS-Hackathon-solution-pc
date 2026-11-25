import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attendance, courses, sessions } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'
export async function GET() {
  const auth = await requireRole('student'); if (auth.response) return auth.response
  const rows = await db.select({ id: attendance.id, status: attendance.status, createdAt: attendance.createdAt, distanceMeters: attendance.distanceMeters, courseCode: courses.code, courseTitle: courses.title, sessionTitle: sessions.title }).from(attendance).innerJoin(sessions, eq(attendance.sessionId, sessions.id)).innerJoin(courses, eq(sessions.courseId, courses.id)).where(eq(attendance.studentId, auth.user.id)).orderBy(desc(attendance.createdAt))
  return NextResponse.json({ attendance: rows })
}
