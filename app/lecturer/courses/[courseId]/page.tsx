import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { CourseWorkspace } from '@/components/course-workspace'
export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  if (user.role !== 'lecturer') redirect('/student')
  const { courseId } = await params
  const [course] = await db.select({ id: courses.id, code: courses.code, title: courses.title }).from(courses).where(and(eq(courses.id, courseId), eq(courses.lecturerId, user.id))).limit(1)
  if (!course) notFound()
  return <CourseWorkspace courseId={course.id} code={course.code} title={course.title} />
}
