import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card } from './ui'

export default function ProctoringGate({ title = 'Secure assessment', onExit, children }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [violations, setViolations] = useState(0)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (ready && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [ready])

  useEffect(() => {
    let mounted = true
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setReady(true)
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {})
        }
      } catch {
        setError('Camera permission is required to start this secure assessment.')
      }
    }

    const reportViolation = (message) => {
      setViolations((count) => count + 1)
      setWarning(message)
      window.setTimeout(() => setWarning(''), 3500)
    }
    const onVisibility = () => {
      if (document.hidden) reportViolation('Please keep the assessment tab active.')
    }
    const onFullscreen = () => {
      if (!document.fullscreenElement) reportViolation('Fullscreen is required during the assessment.')
    }
    const onContextMenu = (event) => event.preventDefault()
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'p', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault()
        reportViolation('Copy, paste, print, and save shortcuts are disabled.')
      }
    }

    startCamera()
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {})
    }
  }, [])

  if (!ready) {
    return (
      <Card className="mx-auto max-w-xl">
        <div className="flex flex-col gap-4">
          <div>
            <Badge tone="amber">Secure mode</Badge>
            <h2 className="mt-3 text-xl font-semibold text-navy-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-storm-500">
              Camera access and fullscreen keep this assessment fair. Your camera feed stays in this browser session and is not recorded by the app.
            </p>
          </div>
          {error ? (
            <div className="rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-storm-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Requesting camera permission…
            </div>
          )}
          <Button variant="outline" onClick={onExit}>Cancel</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-teal-500/30 bg-teal-100/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-16 overflow-hidden rounded-md bg-navy-950">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-coral-600 px-1 text-[9px] font-bold text-white">LIVE</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900">Secure mode active</p>
            <p className="text-xs text-storm-500">Camera on · Fullscreen required</p>
          </div>
        </div>
        <Badge tone={violations ? 'amber' : 'teal'}>{violations} focus warnings</Badge>
      </div>
      {warning && <div className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-500">{warning}</div>}
      {children}
    </div>
  )
}
