# OrnateOS

**Multilingual voice-to-ledger SaaS** for jewellery businesses. Each owner gets a private workspace — memos, inventory, maker orders, and per-karigar dashboards.

## Product features

| Feature | Description |
|---------|-------------|
| **Multi-tenant** | Sign up → create business → isolated data (Supabase RLS) |
| **Record** | Voice, receipt photo (R2), or text in Gujarati/Hindi/English |
| **Maker orders** | Track who has what, order date, promised delivery, receive flow |
| **Per-maker dashboard** | Pending, overdue, turnaround, history by item type |
| **Business dashboard** | Inventory, memos, exposure, pending orders |
| **Receive disambiguation** | Pick the right order when multiple are pending |

## Architecture

### System overview

```mermaid
flowchart TB
  subgraph clients [Client — React + Vite]
    LP[Landing / Auth / Onboarding]
    APP[App Shell]
    DASH[Dashboard]
    REC[Record + Preview]
    ORD[Orders + Makers]
  end

  subgraph edge [Supabase Edge Functions]
    PI[process-input]
    R2[r2-presign]
  end

  subgraph ai [AI Services]
    WH[Whisper STT]
    VIS[Vision OCR]
    LLM[GPT structured JSON]
  end

  subgraph storage [Storage]
    PG[(PostgreSQL + RLS)]
    R2B[(Cloudflare R2)]
  end

  LP --> APP
  APP --> DASH
  APP --> REC
  APP --> ORD
  REC --> PI
  REC --> R2
  R2 --> R2B
  PI --> WH
  PI --> VIS
  PI --> LLM
  PI --> REC
  REC -->|confirm| PG
  ORD --> PG
  DASH --> PG
  APP -->|Auth JWT| PG
```

Each **business** is a tenant. Row Level Security ensures users only read and write rows where `business_id` matches their profile.

### Multi-tenant data model

```mermaid
erDiagram
  businesses ||--o{ profiles : has
  businesses ||--o{ transactions : owns
  businesses ||--o{ makers : owns
  businesses ||--o{ maker_orders : owns
  makers ||--o{ maker_orders : fulfills

  businesses {
    uuid id PK
    text name
    text business_type
    text city
  }

  profiles {
    uuid id PK
    uuid business_id FK
    text role
  }

  transactions {
    uuid id PK
    uuid business_id FK
    jsonb record
    text status
  }

  makers {
    uuid id PK
    uuid business_id FK
    text name
  }

  maker_orders {
    uuid id PK
    uuid business_id FK
    uuid maker_id FK
    text item_category
    numeric weight_ordered
    date promised_at
    text status
  }
```

### Record → ledger pipeline

```mermaid
sequenceDiagram
  participant U as Business owner
  participant R as Record screen
  participant E as process-input
  participant P as Preview
  participant DB as Postgres

  U->>R: Voice / photo / text
  alt Receipt image
    R->>E: Upload via R2 presign
  end
  R->>E: Raw input
  E->>E: STT / OCR / LLM parse
  E-->>R: Structured JSON + summary
  R->>P: Review
  alt Multiple pending orders
    P->>U: Pick which order received
  end
  U->>P: Confirm
  P->>DB: Insert transaction + update orders
  P-->>U: Dashboard / Orders updated
```

### Auth and workspace flow

```mermaid
flowchart LR
  A[Landing] --> B{Signed in?}
  B -->|No| C[Signup / Login]
  C --> D{Business setup?}
  D -->|No| E[Onboarding]
  E --> F[Create business + profile]
  F --> G[App Shell]
  B -->|Yes| D
  D -->|Yes| G
  G --> H[Dashboard]
  G --> I[Record]
  G --> J[Orders / Makers]
  G --> K[Settings]
```

**Demo mode** (no Supabase env): the same flows run with `localStorage` keyed by `business_id` instead of Postgres.

## User flow

1. **Landing** → Sign up / Log in  
2. **Onboarding** → Business name, type (wholesaler / retailer / manufacturer)  
3. **App** → Sidebar (desktop) or bottom nav (mobile): Home, Record, Orders, Makers, Settings  

### Demo without Supabase

Any email + password works. Data is stored per business in `localStorage`.

### Production (Supabase)

```bash
cp .env.example .env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase db push
npx supabase functions deploy process-input
npx supabase functions deploy r2-presign
```

Enable **Email** provider in Supabase Auth.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Routes

| Route | Access |
|-------|--------|
| `/` | Landing |
| `/signup`, `/login` | Auth |
| `/onboarding` | New business setup |
| `/dashboard` | Home |
| `/record` | Voice / image / text input |
| `/preview` | Confirm AI result |
| `/orders` | Maker orders |
| `/makers`, `/makers/:id` | Maker hub & detail |
| `/settings` | Business profile |

## Stack

- React + Vite + Tailwind  
- Supabase Auth + Postgres + RLS  
- Edge Functions (Whisper, Vision, LLM)  
- Cloudflare R2 (receipts)  

## License

MIT
