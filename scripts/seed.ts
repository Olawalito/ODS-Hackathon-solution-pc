import { randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, pool } from '../lib/db'
import { courses, users } from '../lib/db/schema'

async function main() {
  const passwordHash = await hash('BITMARK-demo-2026', 12)
  const lecturerEmail = 'lecturer@bitmark.test'
  let [lecturer] = await db.select().from(users).where(eq(users.email, lecturerEmail)).limit(1)
  if (!lecturer) {
    lecturer = { id: randomUUID(), name: 'Dr. Ada Okafor', email: lecturerEmail, passwordHash, role: 'lecturer', matricNumber: null, faceDescriptor: null, createdAt: new Date() }
    await db.insert(users).values(lecturer)
  }
  const students = [
    { email: 'amara@bitmark.test', name: 'Amara Bello', matricNumber: 'BIT/2026/001' },
    { email: 'tunde@bitmark.test', name: 'Tunde Adebayo', matricNumber: 'BIT/2026/002' },
  ]
  for (const student of students) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, student.email)).limit(1)
    if (!existing) await db.insert(users).values({ id: randomUUID(), ...student, passwordHash, role: 'student', faceDescriptor: Array.from({ length: 128 }, () => 0) })
  }
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.lecturerId, lecturer.id)).limit(1)
  if (!course) await db.insert(courses).values({ id: randomUUID(), code: 'CSC301', title: 'Data Structures & Algorithms', lecturerId: lecturer.id })
  console.info('BITMARK seed complete. Demo login password: BITMARK-demo-2026')
}
main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => pool.end())
