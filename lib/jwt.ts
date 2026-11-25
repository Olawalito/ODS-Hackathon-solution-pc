import { SignJWT, jwtVerify } from 'jose'
export type AppRole = 'student' | 'lecturer'
const secret = () => {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters')
  return new TextEncoder().encode(value)
}
export async function issueToken(user: { id: string; role: AppRole }) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuedAt().setExpirationTime('7d').sign(secret())
}
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    if (typeof payload.sub !== 'string' || (payload.role !== 'student' && payload.role !== 'lecturer')) return null
    return { id: payload.sub, role: payload.role as AppRole }
  } catch { return null }
}
