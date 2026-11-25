'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights'
const STARTUP_TIMEOUT_MS = 45_000

type Props = { onDescriptor: (descriptor: number[] | null) => void }
type MessageTone = 'info' | 'error' | 'success'

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Camera access was blocked. Allow camera access for this site in your browser settings, then try again.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera was found. Connect or enable a camera, then try again.'
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Your camera is being used by another app. Close that app and try again.'
    }
  }

  if (error instanceof Error && error.message.includes('does not support camera')) {
    return 'This browser does not support camera access. Try a recent version of Chrome, Edge, Safari, or Firefox.'
  }

  return 'The camera could not be started. Check your browser permissions and camera connection, then try again.'
}

export function FaceCapture({ onDescriptor }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'captured' | 'error'>('loading')
  const [message, setMessage] = useState('Requesting camera access…')
  const [messageTone, setMessageTone] = useState<MessageTone>('info')
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    let timedOut = false
    let stage: 'camera' | 'models' = 'camera'

    setState('loading')
    setMessageTone('info')
    setMessage('Requesting camera access…')
    onDescriptor(null)

    const timeout = window.setTimeout(() => {
      timedOut = true
      if (active) {
        setState('error')
        setMessageTone('error')
        setMessage('Camera or face-verification setup is taking too long. Check camera permission and your internet connection, then retry.')
      }
    }, STARTUP_TIMEOUT_MS)

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support camera access.')
        }

        const media = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' } },
          audio: false,
        })

        if (!active || timedOut) {
          media.getTracks().forEach((track) => track.stop())
          return
        }

        stream.current = media
        if (!video.current) throw new Error('Camera preview is unavailable.')
        video.current.srcObject = media
        await video.current.play()

        stage = 'models'
        setMessage('Camera connected. Loading face-verification models…')

        const faceapi = await import('face-api.js')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        if (!active || timedOut) return
        setState('ready')
        setMessage('Center your face in the frame, then capture.')
      } catch (error) {
        if (!active || timedOut) return
        setState('error')
        setMessageTone('error')
        setMessage(
          stage === 'camera'
            ? getCameraErrorMessage(error)
            : 'Face-verification models could not load. Check your internet connection and retry.',
        )
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void start()

    return () => {
      active = false
      window.clearTimeout(timeout)
      stream.current?.getTracks().forEach((track) => track.stop())
      stream.current = null
      if (video.current) video.current.srcObject = null
    }
  }, [attempt, onDescriptor])

  async function capture() {
    if (!video.current || busy) return
    setBusy(true)
    setMessageTone('info')

    try {
      const faceapi = await import('face-api.js')
      const result = await faceapi
        .detectSingleFace(video.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!result) {
        setMessageTone('error')
        setMessage('No clear face detected. Move into better light, center your face, and try again.')
        setState('ready')
        onDescriptor(null)
        return
      }

      onDescriptor(Array.from(result.descriptor))
      setState('captured')
      setMessageTone('success')
      setMessage('Face captured securely. Only the mathematical descriptor is saved.')
    } catch {
      setMessageTone('error')
      setMessage('Face capture failed. Keep your face in frame and try again.')
      setState('ready')
      onDescriptor(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950">
        <video ref={video} muted playsInline className="size-full object-cover" aria-label="Live camera preview" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-2/3 w-1/2 rounded-[48%] border border-white/70 shadow-[0_0_0_999px_rgba(10,19,35,0.18)]" />
        </div>
      </div>
      <p
        className={cn(
          'mt-3 flex items-start gap-2 rounded-xl text-sm font-medium text-slate-950',
          messageTone === 'error' && 'border border-rose-400 bg-rose-50 p-3',
          messageTone === 'success' && 'text-slate-950',
        )}
        role={messageTone === 'error' ? 'alert' : 'status'}
        aria-live={messageTone === 'error' ? 'assertive' : 'polite'}
      >
        {messageTone === 'error' ? (
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-rose-800" aria-hidden="true" />
        ) : messageTone === 'success' ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
        ) : (
          <Camera className="mt-0.5 size-4 shrink-0 text-slate-950" aria-hidden="true" />
        )}
        <span>{message}</span>
      </p>
      {state === 'error' ? (
        <Button type="button" onClick={() => setAttempt((current) => current + 1)} variant="outline" className="mt-3 w-full border-slate-400 text-slate-950 hover:bg-slate-100">
          Retry camera setup
        </Button>
      ) : (
        <Button
          type="button"
          onClick={capture}
          disabled={state === 'loading' || busy}
          variant={state === 'captured' ? 'outline' : 'default'}
          className="mt-3 w-full"
        >
          {busy ? (
            <>
              <RefreshCw className="animate-spin" data-icon="inline-start" />
              Checking face…
            </>
          ) : state === 'captured' ? (
            'Capture again'
          ) : state === 'loading' ? (
            'Preparing camera…'
          ) : (
            'Capture face'
          )}
        </Button>
      )}
    </div>
  )
}
