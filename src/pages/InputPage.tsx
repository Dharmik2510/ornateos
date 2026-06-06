import { Camera, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { blobToBase64 } from '../lib/audio'
import { processInput, uploadReceipt } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { ScrollReveal } from '../components/motion/ScrollReveal'
import { Button } from '../components/ui/Button'

const EXAMPLES = [
  'Aaje 10 gram gold XYZ ne memo aapyo',
  'Ramesh ne 25 gram ring order, 28 tarikh sudhi aapse',
  'Jayesh thi 24 gram necklace mali gayu',
]

export function InputPage() {
  const { business } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewName, setPreviewName] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
      // R2 upload failed — fall back to a local object URL so the user can
      // still process the receipt this session, but tell them it won't persist.
      imageUrl = URL.createObjectURL(file)
      setNotice('Upload to cloud failed — using a local copy that won’t be saved across sessions.')
    }
    await runProcess('image', { imageUrl, text: '' })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Record"
        description={`Add to ${business?.name ?? 'your ledger'} — voice, photo, or text in any language.`}
      />

      <ScrollReveal variant="up" delay={0}>
        <section className="glass-card p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 size-40 bg-gold-500/10 blur-3xl pointer-events-none" aria-hidden />
          <p className="text-center text-sm text-gold-400/80 font-medium mb-6">Voice input</p>
          <VoiceRecorder onRecorded={onVoice} disabled={loading} />
        </section>
      </ScrollReveal>

      <ScrollReveal variant="up" delay={120}>
        <section className="glass-card p-6 space-y-4">
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-gold-500/30 text-gold-200 hover:bg-gold-500/10 transition disabled:opacity-50 min-h-[44px]"
          >
            <Camera className="size-5" />
            <span key={previewName ?? 'placeholder'} className="animate-scale-in">
              {previewName ? previewName : 'Upload receipt photo'}
            </span>
          </button>
          {notice && (
            <p className="text-xs text-amber-300/90 animate-slide-up" role="status">
              {notice}
            </p>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="up" delay={240}>
        <section className="glass-card p-6 space-y-4">
          <label className="text-sm font-medium text-stone-300" htmlFor="msg">
            Type a message
          </label>
          <textarea
            id="msg"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLES[0]}
            className="w-full rounded-xl bg-ink-700 border border-ink-600 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <p className="text-xs text-stone-500">
            Try orders:{' '}
            {EXAMPLES.slice(1).map((ex, i) => (
              <button
                key={ex}
                type="button"
                className="text-gold-500/80 hover:underline mr-2"
                onClick={() => setText(ex)}
              >
                {i === 0 ? 'place order' : 'receive order'}
              </button>
            ))}
          </p>
          <Button
            type="button"
            loading={loading}
            disabled={loading || !text.trim()}
            onClick={() => void runProcess('text')}
            className="w-full py-3"
          >
            {!loading && <Send className="size-5" />}
            Process with AI
          </Button>
        </section>
      </ScrollReveal>
    </div>
  )
}
