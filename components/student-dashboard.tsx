'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, CalendarDays, Fingerprint, LogOut, MapPin, ScanFace } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FaceCapture } from '@/components/face-capture'

const fetcher = async (url: string) => { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data }
type RecordItem = { id: string; courseCode: string; courseTitle: string; sessionTitle: string; createdAt: string; status: string; distanceMeters: number }
export function StudentDashboard({ name }: { name: string }) {
  const { data, error, mutate } = useSWR<{ attendance: RecordItem[] }>('/api/attendance', fetcher)
  const [code, setCode] = useState('')
  const [descriptor, setDescriptor] = useState<number[] | null>(null)
  const [pending, setPending] = useState(false)
  async function mark(event: FormEvent) {
    event.preventDefault()
    if (!descriptor) { toast.error('Capture your face before marking attendance.'); return }
    if (!navigator.geolocation) { toast.error('Location is unavailable in this browser.'); return }
    setPending(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
      const response = await fetch('/api/attendance/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: code.trim().toUpperCase(), lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, faceDescriptor: descriptor }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not verify attendance.')
      toast.success(`Attendance marked. You are ${result.distanceMeters} m from the class.`); setCode(''); setDescriptor(null); await mutate()
    } catch (error) {
      const message = error instanceof GeolocationPositionError ? error.code === error.PERMISSION_DENIED ? 'Location permission was denied. Allow location access to mark attendance.' : 'Could not get your location. Move near a window and try again.' : error instanceof Error ? error.message : 'Could not mark attendance.'
      toast.error(message)
    } finally { setPending(false) }
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/' }
  return <main className="min-h-screen bg-[#f8f9fb] text-slate-950">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/student" className="text-sm font-bold tracking-[0.16em] text-slate-950">BITMARK<span className="ml-2 text-[#1e4fd4]">/ STUDENT</span></Link><button onClick={logout} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950"><LogOut className="size-4" />Sign out</button></div></header>
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12"><div><p className="text-sm text-slate-500">Student dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you, {name.split(' ')[0]}.</h1><p className="mt-2 text-slate-600">Mark attendance for a class in progress.</p></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1e4fd4]"><Fingerprint className="size-5" /></div><div><h2 className="font-semibold">Mark attendance</h2><p className="text-sm text-slate-500">You need your class code, location, and face.</p></div></div>
          <form onSubmit={mark} className="mt-6 flex flex-col gap-4"><label htmlFor="class-code" className="text-sm font-medium">Enter class code</label><input id="class-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} required minLength={6} maxLength={6} autoCapitalize="characters" className="h-14 rounded-xl border border-slate-200 px-4 text-center font-mono text-2xl font-semibold tracking-[0.35em] outline-none focus:border-[#1e4fd4] focus:ring-2 focus:ring-[#1e4fd4]/15" placeholder="••••••" />
            <div className="grid gap-3 sm:grid-cols-2"><div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0 text-[#1e4fd4]" /><span>When you continue, your browser will ask to share your location. High accuracy is used.</span></div><div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><ScanFace className="mt-0.5 size-4 shrink-0 text-[#1e4fd4]" /><span>Allow camera access and capture your live face. The image is not saved.</span></div></div>
            <FaceCapture onDescriptor={setDescriptor} />
            <Button disabled={pending || !descriptor || code.length !== 6} className="h-12 rounded-xl bg-[#1e4fd4] text-white hover:bg-[#1741b8]">{pending ? 'Verifying location and face…' : 'Verify & mark attendance'}<ArrowUpRight data-icon="inline-end" /></Button>
          </form>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Attendance history</h2><p className="mt-1 text-sm text-slate-500">Your recent class check-ins.</p></div><CalendarDays className="size-5 text-slate-400" /></div>
          <div className="mt-5 flex flex-col divide-y divide-slate-100">{error ? <p className="py-8 text-sm text-rose-600">Could not load attendance history.</p> : !data ? <p className="py-8 text-sm text-slate-500">Loading attendance…</p> : data.attendance.length === 0 ? <div className="py-12 text-center"><CalendarDays className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-medium">Nothing here yet</p><p className="mt-1 text-xs text-slate-500">Your marked classes will show up here.</p></div> : data.attendance.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.courseCode}<span className="font-normal text-slate-500"> · {item.courseTitle}</span></p><p className="mt-1 truncate text-xs text-slate-500">{item.sessionTitle} · {new Date(item.createdAt).toLocaleString()}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{item.status}</span></article>)}</div>
        </section>
      </div>
    </div>
  </main>
}
