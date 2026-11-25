import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LecturerDashboard } from '@/components/lecturer-dashboard'
export default async function LecturerPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  if (user.role !== 'lecturer') redirect('/student')
  return <LecturerDashboard name={user.name} />
}
