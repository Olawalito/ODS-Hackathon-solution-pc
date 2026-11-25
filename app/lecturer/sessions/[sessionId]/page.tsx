import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses, sessions } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { SessionEvaluation } from '@/components/session-evaluation'
export default async function EvaluationPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  if (user.role !== 'lecturer') redirect('/student')
  const { sessionId } = await params
  const [row] = await db.select({ id: sessions.id, title: sessions.title }).from(sessions).innerJoin(courses, eq(sessions.courseId, courses.id)).where(and(eq(sessions.id, sessionId), eq(courses.lecturerId, user.id))).limit(1)
  if (!row) notFound()
  return <SessionEvaluation sessionId={row.id} title={row.title} />
}
