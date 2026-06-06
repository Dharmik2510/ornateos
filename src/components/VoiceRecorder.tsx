import { Mic, Square, MicOff } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        onRecorded(blob, mimeType)
      }
      mediaRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError('Microphone access is blocked. Allow it in your browser, then tap to retry.')
    }
  }, [onRecorded])

  const stop = useCallback(() => {
    mediaRef.current?.stop()
    setRecording(false)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        className={`relative flex flex-col items-center justify-center gap-3 w-full aspect-square max-w-[200px] mx-auto rounded-full border-2 transition-all duration-300 shadow-xl ${
          recording
            ? 'border-red-400/60 bg-red-950/40 scale-105'
            : 'border-gold-400/50 bg-gold-500/10 hover:bg-gold-500/20 hover:border-gold-400 hover:scale-[1.02]'
        } disabled:opacity-50`}
      >
        {recording && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" aria-hidden />
            <span className="absolute inset-2 rounded-full bg-red-500/5 animate-pulse-soft" aria-hidden />
          </>
        )}
        {recording ? (
          <Square className="size-12 text-red-300 relative" fill="currentColor" />
        ) : (
          <Mic className="size-12 text-gold-300 relative" />
        )}
        <span className="text-sm font-medium text-stone-300 relative">
          {recording ? 'Tap to stop' : 'Hold to speak'}
        </span>
      </button>

      {error && (
        <p className="flex items-center gap-2 text-xs text-red-300 text-center max-w-[260px] animate-slide-up">
          <MicOff className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
