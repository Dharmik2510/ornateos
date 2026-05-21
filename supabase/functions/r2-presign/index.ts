import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const accountId = Deno.env.get('R2_ACCOUNT_ID')
const accessKey = Deno.env.get('R2_ACCESS_KEY_ID')
const secretKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
const bucket = Deno.env.get('R2_BUCKET_NAME') ?? 'ornateos-receipts'
const publicBase = Deno.env.get('R2_PUBLIC_URL')

async function hmacSha256(key: string | Uint8Array, message: string) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return new Uint8Array(sig)
}

function toHex(buf: Uint8Array) {
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function presignPut(key: string, contentType: string, expiresSec = 3600) {
  const host = `${accountId}.r2.cloudflarestorage.com`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const credential = `${accessKey}/${dateStamp}/auto/s3/aws4_request`
  const signedHeaders = 'content-type;host'
  const canonicalUri = `/${bucket}/${key}`
  const query =
    `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}` +
    `&X-Amz-Date=${amzDate}&X-Amz-Expires=${expiresSec}&X-Amz-SignedHeaders=${encodeURIComponent(signedHeaders)}`
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    query,
    `content-type:${contentType}\nhost:${host}\n`,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const scope = `${dateStamp}/auto/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)))),
  ].join('\n')
  const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp)
  const kRegion = await hmacSha256(kDate, 'auto')
  const kService = await hmacSha256(kRegion, 's3')
  const kSigning = await hmacSha256(kService, 'aws4_request')
  const signature = toHex(await hmacSha256(kSigning, stringToSign))
  const uploadUrl = `https://${host}${canonicalUri}?${query}&X-Amz-Signature=${signature}`
  const publicUrl = publicBase
    ? `${publicBase.replace(/\/$/, '')}/${key}`
    : uploadUrl.split('?')[0]
  return { uploadUrl, publicUrl, key }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!accountId || !accessKey || !secretKey) {
    return new Response(
      JSON.stringify({ error: 'R2 credentials not configured on Supabase' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const { filename, contentType } = await req.json()
    const safe = (filename as string).replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `receipts/${crypto.randomUUID()}-${safe}`
    const result = await presignPut(key, contentType ?? 'image/jpeg')
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
