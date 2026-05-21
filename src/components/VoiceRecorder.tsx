import { Mic, Square } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
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
      alert('Microphone access is required for voice input.')
    }
  }, [onRecorded])

  const stop = useCallback(() => {
    mediaRef.current?.stop()
    setRecording(false)
  }, [])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={recording ? stop : start}
      className={`flex flex-col items-center justify-center gap-3 w-full aspect-square max-w-[200px] mx-auto rounded-full border-2 transition shadow-xl ${
        recording
          ? 'border-red-400/60 bg-red-950/40 animate-pulse'
          : 'border-gold-400/50 bg-gold-500/10 hover:bg-gold-500/20 hover:border-gold-400'
      } disabled:opacity-50`}
    >
      {recording ? (
        <Square className="size-12 text-red-300" fill="currentColor" />
      ) : (
        <Mic className="size-12 text-gold-300" />
      )}
      <span className="text-sm font-medium text-stone-300">
        {recording ? 'Tap to stop' : 'Hold to speak'}
      </span>
    </button>
  )
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
