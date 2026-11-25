import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'

const courseSchema = z.object({ code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/).transform((v) => v.toUpperCase()), title: z.string().trim().min(2).max(120) })
export async function GET() {
  const auth = await requireRole('lecturer')
  if (auth.response) return auth.response
  return NextResponse.json({ courses: await db.select().from(courses).where(eq(courses.lecturerId, auth.user.id)) })
}
export async function POST(request: NextRequest) {
  const auth = await requireRole('lecturer')
  if (auth.response) return auth.response
  const parsed = courseSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid course code and title.' }, { status: 400 })
  const course = { id: randomUUID(), ...parsed.data, lecturerId: auth.user.id }
  await db.insert(courses).values(course)
  return NextResponse.json({ course }, { status: 201 })
}
