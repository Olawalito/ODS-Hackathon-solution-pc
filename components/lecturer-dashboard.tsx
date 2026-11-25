'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, BookOpen, LogOut, Plus, School } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const fetcher = async (url: string) => { const res = await fetch(url); const data = await res.json(); if (!res.ok) throw new Error(data.error); return data }
type Course = { id: string; code: string; title: string }
export function LecturerDashboard({ name }: { name: string }) {
  const { data, mutate, error } = useSWR<{ courses: Course[] }>('/api/courses', fetcher)
  const [pending, setPending] = useState(false)
  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try { const response = await fetch('/api/courses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: form.get('code'), title: form.get('title') }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); formElement.reset(); toast.success('Course registered.'); await mutate() } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not register course.') } finally { setPending(false) }
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/' }
  return <main className="min-h-screen bg-[#f8f9fb] text-slate-950"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4"><Link href="/lecturer" className="text-sm font-bold tracking-[0.16em]">BITMARK<span className="ml-2 text-[#1e4fd4]">/ LECTURER</span></Link><button onClick={logout} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950"><LogOut className="size-4" />Sign out</button></div></header>
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12"><p className="text-sm text-slate-500">Lecturer dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome, {name.split(' ')[0]}.</h1><p className="mt-2 text-slate-600">Manage courses and start a verified attendance session.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.72fr]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Your courses</h2><p className="mt-1 text-sm text-slate-500">Open a course to manage its sessions.</p></div><School className="size-5 text-slate-400" /></div><div className="mt-5 flex flex-col divide-y divide-slate-100">{error ? <p className="py-5 text-sm text-rose-600">Could not load courses.</p> : !data ? <p className="py-5 text-sm text-slate-500">Loading courses…</p> : data.courses.length === 0 ? <div className="py-10 text-center"><BookOpen className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-medium">No courses registered</p><p className="mt-1 text-xs text-slate-500">Add a course to get started.</p></div> : data.courses.map((course) => <Link key={course.id} href={`/lecturer/courses/${course.id}`} className="group flex items-center justify-between gap-4 py-4"><div><p className="text-xs font-semibold tracking-wider text-[#1e4fd4]">{course.code}</p><p className="mt-1 font-medium">{course.title}</p></div><ArrowUpRight className="size-4 text-slate-400 transition group-hover:text-[#1e4fd4]" /></Link>)}</div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1e4fd4]"><Plus className="size-5" /></div><div><h2 className="font-semibold">Register course</h2><p className="text-sm text-slate-500">Add a course you teach.</p></div></div><form onSubmit={createCourse} className="mt-5 flex flex-col gap-4"><label className="flex flex-col gap-1.5 text-sm font-medium">Course code<input name="code" required maxLength={20} placeholder="CSC301" className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1e4fd4]" /></label><label className="flex flex-col gap-1.5 text-sm font-medium">Course title<input name="title" required maxLength={120} placeholder="Data Structures" className="h-11 rounded-xl border border-slate-200 px-3 outline-none focus:border-[#1e4fd4]" /></label><Button disabled={pending} className="h-11 rounded-xl bg-[#1e4fd4] text-white hover:bg-[#1741b8]">{pending ? 'Registering…' : 'Register course'}</Button></form></section></div>
    </div></main>
}
