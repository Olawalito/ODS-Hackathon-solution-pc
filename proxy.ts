import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
const COOKIE_NAME = 'bitmark_session'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  const path = request.nextUrl.pathname
  const role = path.startsWith('/student') ? 'student' : path.startsWith('/lecturer') || path.startsWith('/courses') ? 'lecturer' : null
  if (!user) return NextResponse.redirect(new URL('/?signin=1', request.url))
  if (role && user.role !== role) return NextResponse.redirect(new URL(user.role === 'student' ? '/student' : '/lecturer', request.url))
  return NextResponse.next()
}
export const config = { matcher: ['/dashboard/:path*', '/student/:path*', '/lecturer/:path*', '/courses/:path*'] }
