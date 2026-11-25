'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Fingerprint, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FaceCapture } from '@/components/face-capture'

type Role = 'student' | 'lecturer'
export function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [role, setRole] = useState<Role>('student')
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true)
    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = { email: form.get('email'), password: form.get('password') }
    if (mode === 'register') {
      Object.assign(payload, {
        name: form.get('name'),
        role,
        ...(role === 'student'
          ? { matricNumber: String(form.get('matricNumber') ?? ''), faceDescriptor: descriptor }
          : { lecturerSignupCode: String(form.get('lecturerSignupCode') ?? '') }),
      })
    }
    try {
      const response = await fetch(`/api/auth/${mode === 'signin' ? 'login' : 'register'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Please try again.')
      toast.success(mode === 'signin' ? 'Welcome back.' : 'Your BITMARK account is ready.')
      router.push(data.user.role === 'student' ? '/student' : '/lecturer'); router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not complete your request.') }
    finally { setPending(false) }
  }
  return <main className="min-h-screen bg-[#f8f9fb] text-slate-950">
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_420px] lg:px-10">
      <section className="hidden lg:block">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.16em]"><span className="grid size-9 place-items-center rounded-xl bg-[#1e4fd4] text-white"><Fingerprint className="size-5" /></span>BITMARK</a>
        <div className="mt-24 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1e4fd4]">Attendance, verified</p><h1 className="mt-5 text-6xl font-semibold leading-[1.04] tracking-[-0.06em]">Show up.<br />Be counted.</h1><p className="mt-6 max-w-md text-lg leading-8 text-slate-950">A more trustworthy way to take attendance. Verified by where you are and who you are.</p></div>
        <div className="mt-14 flex items-center gap-3 text-sm text-slate-950"><ShieldCheck className="size-5 text-[#1e4fd4]" />Your face image is never stored. Only a secure descriptor.</div>
      </section>
      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between lg:hidden"><a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-[0.16em]"><span className="grid size-9 place-items-center rounded-xl bg-[#1e4fd4] text-white"><Fingerprint className="size-5" /></span>BITMARK</a><span className="text-xs text-slate-950">Campus attendance</span></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.3)] sm:p-8">
          <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1e4fd4]">{mode === 'signin' ? 'Your campus, in sync' : 'Get started'}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2><p className="mt-2 text-sm text-slate-950">{mode === 'signin' ? 'Sign in to continue to BITMARK.' : 'Choose your role and complete your profile.'}</p></div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'register' && <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder="Alex Morgan" /></label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">I am a<select value={role} onChange={(e) => { setRole(e.target.value as Role); setDescriptor(null) }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15"><option value="student">Student</option><option value="lecturer">Lecturer</option></select></label>
              {role === 'student' ? <label className="flex flex-col gap-1.5 text-sm font-medium">Matric number<input name="matricNumber" required maxLength={40} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder="e.g. U2024/123456" /></label> : <label className="flex flex-col gap-1.5 text-sm font-medium">Lecturer invitation code<input name="lecturerSignupCode" required maxLength={128} autoComplete="off" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder="Provided by your administrator" /></label>}
            </>}
            <label className="flex flex-col gap-1.5 text-sm font-medium">Email address<input name="email" type="email" required autoComplete="email" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder="you@university.edu" /></label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Password<input name="password" type="password" required minLength={mode === 'register' ? 8 : 1} maxLength={72} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
            {mode === 'register' && role === 'student' && <FaceCapture onDescriptor={setDescriptor} />}
            <Button className="mt-1 h-12 rounded-xl bg-[#1e4fd4] text-white hover:bg-[#1741b8]" type="submit" disabled={pending || (mode === 'register' && role === 'student' && !descriptor)}>{pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}{!pending && <ArrowRight data-icon="inline-end" />}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-950">{mode === 'signin' ? 'New to BITMARK?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setDescriptor(null) }} className="font-semibold text-[#1e4fd4] hover:underline">{mode === 'signin' ? 'Create account' : 'Sign in'}</button></p>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-950">By continuing, you agree to use BITMARK only for authorized university attendance.</p>
      </section>
    </div>
  </main>
}
