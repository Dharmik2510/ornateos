import { Camera, Loader2, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VoiceRecorder, blobToBase64 } from '../components/VoiceRecorder'
import { processInput, uploadReceipt } from '../lib/api'
import { isSupabaseConfigured } from '../lib/supabase'

const EXAMPLE =
  'Aaje 10 gram gold XYZ ne memo aapyo'

export function InputPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewName, setPreviewName] = useState<string | null>(null)

  async function runProcess(
    source: 'voice' | 'image' | 'text',
    extra?: { audioBase64?: string; mimeType?: string; imageUrl?: string; text?: string },
  ) {
    setLoading(true)
    try {
      const result = await processInput({
        source,
        text: extra?.text ?? text,
        audioBase64: extra?.audioBase64,
        mimeType: extra?.mimeType,
        imageUrl: extra?.imageUrl,
      })
      navigate('/preview', { state: { result } })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Processing failed')
    } finally {
      setLoading(false)
    }
  }

  async function onVoice(blob: Blob, mimeType: string) {
    const audioBase64 = await blobToBase64(blob)
    await runProcess('voice', { audioBase64, mimeType, text: '' })
  }

  async function onFile(file: File) {
    setPreviewName(file.name)
    let imageUrl: string | undefined
    try {
      imageUrl = await uploadReceipt(file)
    } catch {
      imageUrl = URL.createObjectURL(file)
    }
    await runProcess('image', { imageUrl, text: '' })
  }

  return (
    <div className="space-y-8">
      <section className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gold-100">Record a transaction</h2>
        <p className="text-stone-400 text-sm max-w-md mx-auto">
          Speak in Gujarati, Hindi, or English — upload a receipt to Cloudflare R2, or type a quick note.
        </p>
        {!isSupabaseConfigured && (
          <p className="text-xs text-amber-400/90 bg-amber-950/40 inline-block px-3 py-1 rounded-full">
            Demo mode: local parser (add Supabase + R2 env for full AI)
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gold-500/15 bg-ink-800 p-8">
        <p className="text-center text-sm text-stone-500 mb-6">Voice input</p>
        <VoiceRecorder onRecorded={onVoice} disabled={loading} />
      </section>

      <section className="rounded-2xl border border-gold-500/15 bg-ink-800 p-6 space-y-4">
        <p className="text-sm font-medium text-stone-300">Receipt / invoice image</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-gold-500/30 text-gold-200 hover:bg-gold-500/10 transition disabled:opacity-50"
        >
          <Camera className="size-5" />
          {previewName ? previewName : 'Upload receipt photo'}
        </button>
      </section>

      <section className="rounded-2xl border border-gold-500/15 bg-ink-800 p-6 space-y-4">
        <label className="text-sm font-medium text-stone-300" htmlFor="msg">
          Type a message
        </label>
        <textarea
          id="msg"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          className="w-full rounded-xl bg-ink-700 border border-ink-600 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
        />
        <button
          type="button"
          disabled={loading || !text.trim()}
          onClick={() => void runProcess('text')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-ink-900 font-semibold hover:opacity-95 transition disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
          Process with AI
        </button>
      </section>
    </div>
  )
}
