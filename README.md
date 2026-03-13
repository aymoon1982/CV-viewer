# TalentLens — AI Recruitment Intelligence

> An AI-powered recruitment platform for HR teams. Upload CVs, score candidates automatically with configurable criteria, compare shortlists side-by-side, and communicate with candidates over WhatsApp — all in one dark-themed, fast UI.

---

## Features

- **Job Profile Builder** — 5-step wizard to define mandatory criteria (eliminators), preferred qualifications, and scoring weights that sum to 100
- **Bulk CV Upload** — Drag-and-drop PDF/DOCX upload with real-time processing progress
- **AI Scoring** — Each candidate scored 0–100 per criterion with justifications powered by Claude
- **Results & Filtering** — Filter by score range, status, tier; sort by score/date/experience
- **Side-by-Side Comparison** — Compare up to 4 candidates in a sticky-header table
- **Candidate Profiles** — Full timeline view with education, experience, skills, certifications, scoring breakdown, and CV preview
- **AI Chat** — Ask questions about a candidate or the entire shortlist; powered by Anthropic Claude
- **WhatsApp Inbox** — Full conversation threads with AI-generated draft replies and message templates
- **Settings** — Configure AI keys, WhatsApp credentials, backend URL, and notification preferences

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (with localStorage persist for Settings) |
| UI Primitives | Radix UI |
| Animation | Framer Motion 12 |
| Charts | Recharts 3 |
| Drag & Drop | @dnd-kit |
| PDF Viewer | react-pdf 10 |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Notifications | Sonner |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#environment-variables) below for details.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

### Required for AI Features

| Variable | Description | Example |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI features. Get from [console.anthropic.com](https://console.anthropic.com) | `sk-ant-api03-...` |
| `ANTHROPIC_MODEL` | Claude model to use. Default: `claude-sonnet-4-6` | `claude-sonnet-4-6` |

**Available models:**
- `claude-sonnet-4-6` — Best balance of speed and quality _(recommended)_
- `claude-opus-4-6` — Most capable, slower
- `claude-haiku-4-5-20251001` — Fastest, lightest

### Required for WhatsApp Integration

| Variable | Description |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Permanent access token from Meta Business Suite → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Numeric Phone Number ID from the same page |
| `WHATSAPP_VERIFY_TOKEN` | A secret string you choose for webhook verification |

> **Security Note:** Never prefix WhatsApp variables with `NEXT_PUBLIC_`. They are server-side only and must never be exposed to the browser.

### Data Source

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | `true` | Set to `true` for mock data (no backend needed), `false` to use real Next.js API routes |
| `NEXT_PUBLIC_API_URL` | _(empty)_ | External backend URL. Leave empty to use built-in `/api/*` routes |

### Optional

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Secret for NextAuth.js (when authentication is added). Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's canonical URL for NextAuth |
| `AWS_ACCESS_KEY_ID` | AWS key for CV file storage in S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret |
| `AWS_S3_BUCKET` | S3 bucket name for uploaded CVs |
| `AWS_S3_REGION` | S3 region (e.g. `eu-west-1`) |

---

## Project Structure

```
app/
├── page.tsx                    # Dashboard
├── layout.tsx                  # Root layout (Navbar + Toasts)
├── settings/page.tsx           # Settings page (Profile, AI, WhatsApp, Integrations, Notifications)
├── jobs/
│   ├── page.tsx                # Job list
│   ├── new/page.tsx            # 5-step job creation wizard
│   └── [id]/
│       ├── edit/page.tsx       # Edit job (same wizard, pre-populated)
│       ├── upload/page.tsx     # Bulk CV upload
│       ├── results/page.tsx    # Candidate results + filtering
│       ├── compare/page.tsx    # Side-by-side comparison (2–4 candidates)
│       └── candidates/[candidateId]/page.tsx  # Full candidate profile
└── whatsapp/page.tsx           # WhatsApp inbox

app/api/                        # Next.js Route Handlers (backend)
├── jobs/route.ts               # GET /api/jobs, POST /api/jobs
├── jobs/[id]/route.ts          # GET, PUT, DELETE /api/jobs/:id
├── jobs/[id]/candidates/route.ts
├── jobs/[id]/upload/route.ts   # POST — CV file upload
├── candidates/[id]/route.ts    # GET, PATCH /api/candidates/:id
├── chat/candidate/route.ts     # POST — AI chat about a candidate
├── chat/shortlist/route.ts     # POST — AI chat about shortlist
└── whatsapp/
    ├── threads/route.ts        # GET all threads
    ├── threads/[id]/route.ts   # GET single thread
    ├── send/route.ts           # POST — send message
    ├── draft/route.ts          # POST — AI draft generation
    └── webhook/route.ts        # GET/POST — WhatsApp webhook

components/
├── candidates/CandidateCard.tsx
├── charts/ScoreGauge.tsx
├── chat/ChatPanel.tsx
├── jobs/JobProfileCard.tsx
├── jobs/builder/               # Step1–Step5 wizard components
├── layout/Navbar.tsx
└── ui/                         # EmptyState, ErrorState, Skeleton, StatusBadge, PDFViewer

lib/
├── api-client.ts               # Dual-mode API client (mock / real)
├── db.ts                       # In-memory store seeded from mock data
├── mock-data.ts                # Development fixtures
└── utils.ts                    # Shared utilities

store/index.ts                  # Zustand stores: Notification, Compare, Filter, Settings
types/index.ts                  # All TypeScript type definitions
```

---

## API Routes

All routes live under `/api/` and are served by Next.js. No separate backend is needed for development.

| Method | Path | Description |
|---|---|---|
| GET | `/api/jobs` | List all job profiles |
| POST | `/api/jobs` | Create a job profile |
| GET | `/api/jobs/:id` | Get job profile by ID |
| PUT | `/api/jobs/:id` | Update job profile |
| DELETE | `/api/jobs/:id` | Archive / delete job |
| GET | `/api/jobs/:id/candidates` | List candidates for a job |
| POST | `/api/jobs/:id/upload` | Upload CV files (multipart/form-data) |
| GET | `/api/candidates/:id` | Get candidate detail |
| PATCH | `/api/candidates/:id` | Update candidate status |
| POST | `/api/chat/candidate` | AI chat about a specific candidate |
| POST | `/api/chat/shortlist` | AI chat about shortlisted candidates |
| GET | `/api/whatsapp/threads` | List WhatsApp threads |
| GET | `/api/whatsapp/threads/:id` | Get thread with messages |
| POST | `/api/whatsapp/send` | Send a WhatsApp message |
| POST | `/api/whatsapp/draft` | Generate AI draft reply |
| GET/POST | `/api/whatsapp/webhook` | WhatsApp webhook (Meta verification + inbound messages) |

---

## Settings Page

Navigate to `/settings` or click your avatar → Settings in the navbar.

| Tab | What you configure |
|---|---|
| **Profile** | Name, email, role (persisted to localStorage) |
| **AI Configuration** | Anthropic API key, model selection, enable/disable AI |
| **WhatsApp** | Access token, Phone Number ID, Verify Token, Webhook URL |
| **Integrations** | Backend API URL, mock data toggle, environment variable summary |
| **Notifications** | Which events trigger in-app notifications |

> Settings are persisted to `localStorage` under the key `talentlens-settings`.

---

## Scoring System

Candidates are scored 0–100 across 5 configurable criteria:

| Criterion | Default Weight | Description |
|---|---|---|
| Years Experience | 20 pts | Compared to min/max range in job profile |
| Technical Skills | 25 pts | Matched against preferred skills list |
| Industry Background | 20 pts | Matched against preferred industries |
| Certifications | 20 pts | Matched against required/preferred certs |
| Languages | 15 pts | Matched against required languages |

**Score Tiers:**
- **Strong Match** ≥ 70 (green)
- **Possible Match** 45–69 (amber)
- **Weak Match** < 45 (red)

Mandatory criteria (degree level, experience range, certifications, UAE work rights) trigger automatic **elimination** — eliminated candidates still appear in results but are collapsed and sorted last.

---

## Development Notes

- **Mock mode** (`NEXT_PUBLIC_USE_MOCK=true`): The app uses hardcoded data from `lib/mock-data.ts`. No API calls are made. Perfect for UI development.
- **Real mode** (`NEXT_PUBLIC_USE_MOCK=false`): The app calls the built-in Next.js API routes at `/api/*`. The routes use an in-memory store seeded from mock data (resets on server restart). Connect a real database for production.
- The in-memory store (`lib/db.ts`) can be replaced with a Prisma/Drizzle ORM client pointing to any SQL/NoSQL database.

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy
```

Set all environment variables in the Vercel dashboard under Settings → Environment Variables.

### Docker / Self-hosted

```bash
npm run build
npm start
```

Ensure all required environment variables are set in your hosting environment.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request
