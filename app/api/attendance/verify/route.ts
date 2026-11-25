import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { attendance, sessions, users } from '@/lib/db/schema'
import { requireRole } from '@/lib/api'
import { faceDescriptorSchema } from '@/lib/validation'
import { haversineDistance } from '@/lib/haversine'

const verifySchema = z.object({ code: z.string().trim().regex(/^[A-Z0-9]{6}$/), lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180), accuracy: z.number().finite().min(0).max(10000), faceDescriptor: faceDescriptorSchema })
export async function POST(request: NextRequest) {
  const auth = await requireRole('student')
  if (auth.response) return auth.response
  const parsed = verifySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Check your location and camera permissions, then try again.' }, { status: 400 })
  const data = parsed.data
  const [session] = await db.select().from(sessions).where(eq(sessions.code, data.code)).limit(1)
  if (!session || !session.isActive || session.expiresAt <= new Date()) return NextResponse.json({ error: 'This class code is invalid or has expired.' }, { status: 404 })
  const [previous] = await db.select({ id: attendance.id }).from(attendance).where(and(eq(attendance.sessionId, session.id), eq(attendance.studentId, auth.user.id))).limit(1)
  if (previous) return NextResponse.json({ error: 'You have already marked attendance for this session.' }, { status: 409 })
  const distanceMeters = haversineDistance(session.lat, session.lng, data.lat, data.lng)
  if (distanceMeters > session.radiusMeters + Math.min(data.accuracy, 30)) return NextResponse.json({ error: `You are too far from class. Distance: ${Math.round(distanceMeters)} m; allowed radius: ${session.radiusMeters} m.`, distanceMeters, radiusMeters: session.radiusMeters }, { status: 403 })
  const [student] = await db.select({ faceDescriptor: users.faceDescriptor }).from(users).where(eq(users.id, auth.user.id)).limit(1)
  const stored = student?.faceDescriptor
  if (!stored || stored.length !== 128) return NextResponse.json({ error: 'No verified face profile is registered for this account.' }, { status: 422 })
  const score = Math.sqrt(stored.reduce((sum, value, index) => sum + (value - data.faceDescriptor[index]) ** 2, 0))
  if (!Number.isFinite(score) || score >= 0.5) return NextResponse.json({ error: 'Face did not match your registered profile. Please try again in good lighting.', faceMatchScore: score }, { status: 403 })
  try {
    await db.insert(attendance).values({ id: randomUUID(), sessionId: session.id, studentId: auth.user.id, distanceMeters, faceMatchScore: score, status: 'present' })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return NextResponse.json({ error: 'You have already marked attendance for this session.' }, { status: 409 })
    throw error
  }
  return NextResponse.json({ ok: true, distanceMeters: Math.round(distanceMeters), faceMatchScore: score })
}
