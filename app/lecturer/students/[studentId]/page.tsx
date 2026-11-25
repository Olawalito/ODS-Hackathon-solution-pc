import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { StudentProfile } from '@/components/student-profile'
export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  if (user.role !== 'lecturer') redirect('/student')
  const { studentId } = await params
  return <StudentProfile studentId={studentId} />
}
