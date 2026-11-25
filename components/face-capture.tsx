'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'
type Props = { onDescriptor: (descriptor: number[] | null) => void }
export function FaceCapture({ onDescriptor }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'captured' | 'error'>('loading')
  const [message, setMessage] = useState('Allow camera access to verify your face.')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Your browser does not support camera access.')
        const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        stream.current = media
        if (video.current) { video.current.srcObject = media; await video.current.play() }
        const faceapi = await import('face-api.js')
        await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)])
        if (active) { setState('ready'); setMessage('Center your face in the frame, then capture.') }
      } catch (error) {
        if (active) { setState('error'); setMessage(error instanceof Error ? error.message : 'Camera permission is needed to continue.') }
      }
    }
    start()
    return () => { active = false; stream.current?.getTracks().forEach((track) => track.stop()) }
  }, [])
  async function capture() {
    if (!video.current || busy) return
    setBusy(true)
    try {
      const faceapi = await import('face-api.js')
      const result = await faceapi.detectSingleFace(video.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor()
      if (!result) { setMessage('We could not see a clear face. Adjust the light and try again.'); setState('ready'); onDescriptor(null); return }
      onDescriptor(Array.from(result.descriptor)); setState('captured'); setMessage('Face captured securely. Only the mathematical descriptor is saved.')
    } catch { setMessage('Face capture failed. Please try again.'); setState('ready'); onDescriptor(null) }
    finally { setBusy(false) }
  }
  return <div className="rounded-2xl border border-border bg-muted/40 p-3">
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950">
      <video ref={video} muted playsInline className="size-full object-cover" aria-label="Live camera preview" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-2/3 w-1/2 rounded-[48%] border border-white/70 shadow-[0_0_0_999px_rgba(10,19,35,0.18)]" /></div>
    </div>
    <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">{state === 'captured' ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Camera className="size-4" />}{message}</p>
    <Button type="button" onClick={capture} disabled={state === 'loading' || state === 'error' || busy} variant={state === 'captured' ? 'outline' : 'default'} className="mt-3 w-full">
      {busy ? <><RefreshCw className="animate-spin" data-icon="inline-start" />Checking face…</> : state === 'captured' ? 'Capture again' : state === 'loading' ? 'Preparing camera…' : 'Capture face'}
    </Button>
  </div>
}
