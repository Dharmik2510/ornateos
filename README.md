# OrnateOS

Multilingual **voice + image + text → structured ledger** for jewellery wholesale. Hackathon demo: speak in Gujarati/Hindi/English, upload a receipt to **Cloudflare R2**, confirm AI output, and watch the dashboard update.

## Stack

- **React** (Vite + TypeScript + Tailwind)
- **Supabase** — PostgreSQL transactions + Edge Functions (Whisper, Vision, LLM)
- **Cloudflare R2** — receipt/invoice image storage (presigned uploads)

## Quick start (demo mode)

Works immediately without cloud keys — uses a local Gujarati-aware parser and `localStorage`.

```bash
cd ~/Projects/ornateos
npm install
npm run dev
```

Open http://localhost:5173

1. Type: `Aaje 10 gram gold XYZ ne memo aapyo` → **Process with AI**
2. **Confirm** on preview
3. Open **Dashboard** — inventory and memos update

## Full setup (Supabase + R2 + OpenAI)

### 1. Supabase

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase db push
npx supabase functions deploy process-input
npx supabase functions deploy r2-presign
npx supabase secrets set OPENAI_API_KEY=sk-...
npx supabase secrets set R2_ACCOUNT_ID=...
npx supabase secrets set R2_ACCESS_KEY_ID=...
npx supabase secrets set R2_SECRET_ACCESS_KEY=...
npx supabase secrets set R2_BUCKET_NAME=ornateos-receipts
npx supabase secrets set R2_PUBLIC_URL=https://your-r2-public-host
```

Copy `.env.example` → `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2. Cloudflare R2

1. Create bucket `ornateos-receipts`
2. Enable public access or custom domain → set `R2_PUBLIC_URL`
3. Create API token with Object Read & Write
4. Add credentials to Supabase secrets (above)

### 3. Run app

```bash
npm run dev
```

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Input | `/` | Voice, R2 image upload, text |
| Preview | `/preview` | AI summary + JSON + confirm |
| Dashboard | `/dashboard` | Inventory, memos, transactions |

## Structured record shape

```json
{
  "type": "memo_out",
  "item": "gold",
  "weight": 10,
  "unit": "gram",
  "party": "XYZ",
  "action": "issued",
  "date": "2026-05-20"
}
```

## License

MIT — hackathon build
