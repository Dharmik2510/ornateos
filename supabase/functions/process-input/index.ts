import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')

interface LedgerRecord {
  type: string
  item: string
  weight: number | null
  unit: string
  party: string
  action: string
  date: string
  notes?: string
}

function demoParse(text: string, source: string) {
  const normalized = text.trim()
  const lower = normalized.toLowerCase()
  let type = 'unknown'
  let action = 'recorded'
  let party = ''
  let weight: number | null = null
  const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gram|grams|gm)/i)
  if (weightMatch) weight = parseFloat(weightMatch[1])
  const partyMatch = normalized.match(/(?:ne|to|for)\s+([A-Za-z0-9]+)/i)
  if (partyMatch) party = partyMatch[1]
  if (/memo/i.test(lower)) {
    type = /return|wapas/i.test(lower) ? 'memo_return' : 'memo_out'
    action = type === 'memo_return' ? 'returned' : 'issued'
  }
  if (!party) {
    const caps = normalized.match(/\b([A-Z]{2,})\b/)
    if (caps) party = caps[1]
  }
  const record: LedgerRecord = {
    type,
    item: 'gold',
    weight,
    unit: 'gram',
    party: party || 'Unknown',
    action,
    date: new Date().toISOString().slice(0, 10),
    notes: normalized,
  }
  const summary =
    type === 'memo_out'
      ? `Memo to ${record.party}${weight ? ` (${weight}g gold)` : ''}`
      : `Recorded: ${normalized.slice(0, 80)}`
  return { rawText: normalized, summary, record, confidence: 0.75, source }
}

async function transcribe(audioBase64: string, mimeType: string): Promise<string> {
  if (!OPENAI_KEY) return 'Aaje 10 gram gold XYZ ne memo aapyo'
  const binary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))
  const form = new FormData()
  const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
  form.append('file', new Blob([binary], { type: mimeType }), `audio.${ext}`)
  form.append('model', 'whisper-1')
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  })
  const json = await res.json()
  return json.text ?? ''
}

async function ocrFromImage(imageUrl: string): Promise<string> {
  if (!OPENAI_KEY) return 'Receipt: 10 gram gold memo XYZ'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this receipt or handwritten note. Return plain text only.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  })
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

async function structureWithLlm(text: string, source: string) {
  if (!OPENAI_KEY) return demoParse(text, source)

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You parse informal Indian jewellery wholesale messages (Gujarati/Hindi/English mix) into JSON.
Return: { "summary": string, "record": { "type": "memo_out"|"memo_return"|"sale"|"purchase"|"payment"|"order_placed"|"order_received"|"unknown", "item": string, "weight": number|null, "unit": "gram"|"kilo", "party": string (maker/customer name), "action": string, "date": "YYYY-MM-DD", "item_category": "ring"|"necklace"|"bracelet"|"earrings"|"bangle"|"chain"|"pendant"|"set"|"other", "promised_at": "YYYY-MM-DD"|null (when maker commits delivery), "notes": string }, "confidence": 0-1 }
order_placed = wholesaler ordered work from a maker/karigar. order_received = goods received back from maker (mali gayu, received, delivered).`,
        },
        { role: 'user', content: text },
      ],
    }),
  })
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) return demoParse(text, source)
  const parsed = JSON.parse(content)
  return {
    rawText: text,
    summary: parsed.summary,
    record: parsed.record,
    confidence: parsed.confidence ?? 0.85,
    source,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const source = body.source ?? 'text'
    let text = body.text?.trim() ?? ''

    if (body.audioBase64) {
      text = await transcribe(body.audioBase64, body.mimeType ?? 'audio/webm')
    } else if (body.imageUrl) {
      text = await ocrFromImage(body.imageUrl)
    }

    if (!text) {
      return new Response(JSON.stringify({ error: 'No input text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await structureWithLlm(text, source)
    if (body.imageUrl) result.receiptUrl = body.imageUrl

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
