import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { StudentDashboard } from '@/components/student-dashboard'
export default async function StudentPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  if (user.role !== 'student') redirect('/lecturer')
  return <StudentDashboard name={user.name} />
}
