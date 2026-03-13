# TalentLens — AI Recruitment Intelligence Platform
## Project Requirements & Development Guide for Claude Code

---

## ⚠️ CRITICAL DEVELOPMENT INSTRUCTION

**Build and fully test the frontend FIRST before touching any backend, API, or integration code.**

The frontend must be completed with realistic mock data, all interactions working, all states handled (loading, empty, error, success), and visually polished before any backend work begins. The UI is the product. Treat it as such.

**Development Order:**
1. ✅ Frontend (Phase 1 of this document) — Complete & Test
2. ⛔ Backend (Phase 2) — Do NOT start until Phase 1 is signed off
3. ⛔ Integrations (Phase 3) — Do NOT start until Phase 2 is signed off

---

## Project Overview

**Product Name:** TalentLens
**Tagline:** Screen smarter. Hire faster. Know why.
**Type:** Full-stack web application
**Primary Users:** Recruiters and hiring managers (small to mid-size teams)

**Core Value Proposition:**
A convenience-first AI recruitment platform where recruiters configure job profiles using toggles and sliders (not text), upload CVs in bulk, receive scored and ranked candidates with per-criterion explanations, converse with candidate profiles using natural language, and communicate with candidates via WhatsApp — all in one workflow.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Backend API | FastAPI (Python) |
| Agent Orchestration | LangGraph |
| Primary LLM | Claude API (claude-sonnet-4-6) |
| Local LLM Fallback | Ollama + Qwen2.5-7B |
| Embeddings | nomic-embed-text via Ollama |
| Vector DB | Qdrant |
| Graph DB | Neo4j Community |
| Relational DB | PostgreSQL |
| Job Queue | Redis + ARQ |
| File Storage | S3-compatible (DigitalOcean Spaces) |
| WhatsApp | Meta WhatsApp Business Cloud API |
| Monitoring | LangSmith |

---

## Design System & Aesthetic Direction

### Visual Identity
- **Aesthetic:** Refined dark-mode professional. Think Bloomberg Terminal meets Linear.app. Dark backgrounds, precise typography, sharp accent colors, data-dense but breathable.
- **Primary Background:** `#0A0A0F` (near black)
- **Surface Color:** `#111118` (card backgrounds)
- **Border Color:** `#1E1E2E` (subtle borders)
- **Primary Accent:** `#6366F1` (indigo — interactive elements, highlights)
- **Success:** `#22C55E` (green scores)
- **Warning:** `#F59E0B` (amber scores)
- **Danger:** `#EF4444` (red scores, eliminations)
- **Text Primary:** `#F1F5F9`
- **Text Secondary:** `#94A3B8`

### Typography
- **Display Font:** `Syne` (Google Fonts) — headings, scores, numbers
- **Body Font:** `DM Sans` (Google Fonts) — all body text, UI labels
- **Mono Font:** `JetBrains Mono` — code, IDs, technical values

### Component Principles
- Generous padding (24px minimum for cards)
- Subtle gradient borders on interactive cards (1px, semi-transparent indigo)
- Score gauges use SVG arc, not CSS — crisp at all sizes
- Skeleton loaders on every data-fetching surface
- Micro-animations on all state transitions (200ms ease-out)
- No flat solid background cards — all cards have a subtle noise texture overlay or gradient

### Responsive Targets
- Desktop first (1280px+ primary)
- Tablet (768px — all features functional)
- Mobile (375px — results and WhatsApp inbox usable)

---

## ═══════════════════════════════════════
## PHASE 1 — FRONTEND (BUILD THIS FIRST)
## ═══════════════════════════════════════

Build the entire frontend using **mock data only**. Every component must be functional, interactive, and production-quality. No placeholder "coming soon" states. The mock data must be realistic enough to evaluate the actual user experience.

### Mock Data Requirements

Create a `/lib/mock-data.ts` file with:

```typescript
// Job Profiles (3 different profiles)
// - "Senior Site Engineer" (Civil/Construction)
// - "Project Manager" (Real Estate Development)
// - "Quantity Surveyor" (Infrastructure)

// Candidates per job (8-12 per job profile)
// Mix of: high scores (75-95), mid scores (45-70), eliminated candidates
// Realistic names, nationalities, experience levels for GCC market
// Each candidate has: extracted fields + per-criterion scores + AI summary

// WhatsApp conversations (3-4 threads)
// Mix of: initial outreach sent, candidate replied, awaiting response

// Scoring criteria examples with weights that sum to 100
```

---

### Page 1 — Dashboard (Route: `/`)

**Purpose:** Command center. Overview of all job profiles and pipeline health.

**Layout:**
- Top navigation bar (fixed): TalentLens logo left, New Job Profile button right, user avatar right
- Stats row: 4 metric cards — Active Jobs, Total Candidates, Shortlisted, Avg Time to Shortlist
- Job Profile cards grid (2 columns on desktop, 1 on mobile)

**Job Profile Card contains:**
- Job title (large, `Syne` font)
- Department / location tag
- Candidate pipeline mini-bar: `[Uploaded: 24] [Scored: 24] [Shortlisted: 8] [Eliminated: 6]`
- Score distribution sparkline (mini bar chart using Recharts)
- Created date
- Status badge: Active / Paused / Closed
- Action buttons: View Results, Edit Profile, Clone, Archive
- Hover state: card lifts (subtle box-shadow transition), gradient border becomes brighter

**Empty State:**
- Centered illustration (SVG, no external images)
- "No job profiles yet" heading
- "Create your first job profile" CTA button

**Test Checklist:**
- [ ] Cards render correctly with all mock data
- [ ] Hover animations work
- [ ] "New Job Profile" opens the builder modal/page
- [ ] "View Results" navigates to results page
- [ ] Empty state shows when no profiles exist
- [ ] Responsive layout correct on 768px and 375px

---

### Page 2 — Job Profile Builder (Route: `/jobs/new` and `/jobs/[id]/edit`)

**Purpose:** Configure a job profile using structured UI — not free text. This is the most important page for the "convenience" goal.

**Layout:** Full-page two-column layout. Left column (40%) = progress steps sidebar. Right column (60%) = current step content.

**Step 1 — Role Basics**

Fields:
- Job Title: text input with autocomplete suggestions (mock: "Site Engineer", "Project Manager", "QS", etc.)
- When a known title is typed, a yellow banner appears: "We found a template for this role. Load it?" with Accept/Dismiss buttons
- Department: single-select dropdown (Engineering / Commercial / Operations / HR / Finance)
- Location: text input (pre-fill with Dubai, UAE)
- Number of Openings: number input with +/- stepper
- Job Description: optional rich-text area (minimal — just for reference, not for AI)

**Step 2 — Mandatory Qualifications**

UI PRINCIPLE: Every field is a toggle, slider, chip selector, or dropdown. Zero free-text requirement fields.

Fields:
- Degree Required: toggle (default ON)
  - When ON: Minimum Degree Level appears — chip selector: `[Any] [Diploma] [Bachelor] [Master] [PhD]`
  - Specific Field Required: tag input with autocomplete — "Civil Engineering", "Architecture", etc.
- Years of Experience: dual-handle range slider
  - Label: "Between X and Y years" updates live as slider moves
  - Range: 0–30 years
- Professional Certifications Required: multi-select tag input
  - Suggestions: PMP, PRINCE2, FIDIC, RICS, LEED, etc.
- Valid UAE Driving License: toggle
- Right to Work in UAE: toggle
  - When ON: Nationality/Visa chips appear (multi-select)

**Step 3 — Preferred Qualifications**

Same UI language as Step 2 but these are soft criteria.

Fields:
- Preferred Skills: tag input, each added skill gets an individual weight slider (1–5 stars, not a number)
  - Skill chips displayed as a card list, each with its star weight control
  - Drag to reorder skills
- Industry Background: multi-select chips — `[Construction] [Real Estate] [Infrastructure] [Oil & Gas] [Government] [Consulting]`
- Employer Type: multi-select chips — `[Main Contractor] [Subcontractor] [Consultant] [Developer] [Government]`
- Languages: multi-select chips — `[Arabic] [English] [French] [Hindi] [Urdu]` (+ add custom)
- Previous Relevant Projects: text tags (e.g., "High-rise residential", "Metro infrastructure")

**Step 4 — Scoring Weights**

A visual weight allocation panel. All mandatory criteria are listed with fixed weight (they are pass/fail, not scored). All preferred criteria are listed with editable weight sliders.

- Total weight indicator: large circular progress ring showing 100% filled when weights are correctly allocated
- As the recruiter drags sliders, the ring and all other weights update in real time
- If total exceeds 100%, a red warning appears and save is blocked
- Preset buttons: "Balanced", "Experience-Heavy", "Skills-Heavy" — auto-distribute weights

**Step 5 — Review & Save**

- Summary card showing all configured criteria in read-only view
- Edit buttons next to each section (jump back to relevant step)
- "Activate Job Profile" button — primary CTA
- "Save as Draft" — secondary CTA

**Form Validation:**
- Zod schema validates each step before allowing Next
- Inline error messages appear below invalid fields
- Step indicator in sidebar shows: completed (checkmark), current (highlighted), pending (grayed)

**Test Checklist:**
- [ ] All 5 steps navigate correctly forward and back
- [ ] Template loading banner appears for known job titles
- [ ] Toggle fields show/hide dependent fields correctly
- [ ] Dual-handle slider works and label updates live
- [ ] Skill weight stars work and chips are deletable
- [ ] Weight ring updates correctly and blocks save when ≠ 100%
- [ ] Preset buttons distribute weights correctly
- [ ] Review step shows all entered data accurately
- [ ] Form validation prevents empty mandatory fields
- [ ] Mobile layout: steps collapse to top tab bar

---

### Page 3 — CV Upload (Route: `/jobs/[id]/upload`)

**Purpose:** Bulk upload CVs for a specific job profile.

**Layout:** Centered single-column, max-width 800px

**Upload Zone:**
- Large dashed-border drop zone (full width, 240px height)
- Icon: upload cloud SVG
- Text: "Drop CVs here or click to browse"
- Sub-text: "PDF, DOCX accepted — up to 50 files at once"
- On drag-over: border color changes to accent, background lightens subtly, scale 1.02 transition

**File List (appears after selection):**
Each file appears as a row with:
- File icon (PDF or DOCX)
- Filename
- File size
- Status indicator: `Queued` → `Extracting` → `Scoring` → `Done` / `Failed`
- Progress bar (thin, accent colored)
- Remove button (× icon, only shown for Queued items)

**Simulation for Frontend Testing:**
Mock the upload flow with a timer:
- 0.5s: status changes to Extracting
- 2s: status changes to Scoring
- 4s: status changes to Done
- 1 in 8 files randomly shows Failed state with "Extraction confidence low — review required" message

**Summary Bar (bottom of file list):**
- Total: X files | Done: X | Failed: X | Processing: X
- "View Results" button appears when at least 1 file reaches Done state

**Test Checklist:**
- [ ] Drag and drop works
- [ ] Click to browse opens file picker
- [ ] Multiple files appear in list
- [ ] Status simulation progresses correctly per file
- [ ] Failed state displays correctly with error message
- [ ] Remove button removes queued files
- [ ] "View Results" button appears at correct time
- [ ] File count limit warning appears when >50 files selected

---

### Page 4 — Results Dashboard (Route: `/jobs/[id]/results`)

**Purpose:** The primary evaluation surface. Ranked candidate cards with filters and actions.

**Layout:** Two-panel. Left panel (320px fixed) = filters sidebar. Right panel = candidate list.

**Filters Sidebar:**
- Score Range: dual-handle slider (0–100)
- Status: checkbox group — `[All] [Shortlisted] [Under Review] [Rejected] [Eliminated] [WhatsApp Sent]`
- Score Tier: radio group — `[All] [Strong Match 70+] [Possible Match 45–69] [Weak Match <45]`
- Missing Criteria: multi-select — list of all job criteria as checkboxes (filter to candidates missing specific ones)
- Sort By: dropdown — `[Score (High to Low)] [Score (Low to High)] [Date Uploaded] [Experience (High to Low)]`
- Clear All Filters: text button
- Apply: primary button (on mobile — on desktop, filters apply live)

**Candidate Card:**

Each card is a horizontal layout:

```
[Score Gauge] [Name & Title]        [Skills Match Bar]  [Actions]
              [Experience • Degree] [AI Summary snippet]
              [Key tags]
```

Score Gauge: SVG arc (180° semicircle), filled proportionally to score, color-coded (green/amber/red). Score number in center with `Syne` font at 28px. "/ 100" in muted text below.

Name & Title: Name in 16px semibold. Current title in 14px muted. Experience years + degree as icon+text tags.

Skills Match Bar: compact horizontal bar divided into segments — green segments for matched criteria, red for missing mandatory, gray for missing preferred. Hovering a segment shows tooltip with criterion name and score.

AI Summary: 2-line truncated text. "Read more" inline link expands in place.

Status Badge: top-right of card — color-coded pill: `Shortlisted` / `Under Review` / `Rejected` / `Eliminated`

Action Buttons (right side, vertical stack):
- Shortlist (star icon) — toggles shortlisted state
- View Profile (eye icon) — navigates to candidate profile page
- WhatsApp (WhatsApp icon) — opens WhatsApp composer modal
- Reject (× icon) — shows confirmation tooltip before rejecting

Eliminated candidates: card has reduced opacity (0.6), red left border, "ELIMINATED" stamp overlay, collapsed by default (expandable to see why)

**Compare Mode:**
- Checkbox appears on hover over each card
- When 2–4 candidates are checked, a "Compare Selected" bar appears at bottom of viewport (sticky)
- Compare bar shows: N candidates selected + "Compare" button + "Clear" button
- Compare button navigates to `/jobs/[id]/compare` page

**Test Checklist:**
- [ ] All mock candidates render correctly
- [ ] Score gauges render with correct colors
- [ ] Filters correctly filter the candidate list (client-side, instant)
- [ ] Sort options work correctly
- [ ] Shortlist toggle updates card status badge
- [ ] Reject shows confirmation before updating
- [ ] Eliminated cards are collapsed and styled distinctly
- [ ] Compare mode: checkbox appears on hover, sticky bar appears, navigation works
- [ ] Responsive: on mobile, sidebar collapses into a filter sheet triggered by a button

---

### Page 5 — Candidate Profile (Route: `/jobs/[id]/candidates/[candidateId]`)

**Purpose:** Full candidate detail view with conversational AI chat.

**Layout:** Two-panel. Left (55%) = candidate data. Right (45%) = chat interface.

**Left Panel — Candidate Data:**

Section 1 — Header:
- Name (large, Syne font)
- Current title + company
- Score gauge (larger version, 80px diameter)
- Status badge + action buttons (Shortlist, Reject, WhatsApp)

Section 2 — Extracted Information (card with sections):
- Personal: nationality, age (if extracted), languages
- Contact: email (redacted by default, click to reveal), phone (redacted, click to reveal)
- Education: timeline of degrees — institution, degree name, year, grade if available
- Experience: timeline of roles — company, title, duration, brief description
- Skills: tag cloud — matched skills in accent color, unmatched in gray
- Certifications: list with icons

Section 3 — Scoring Breakdown (accordion):
- Each criterion as a row: criterion name + weight % + score bar (0–100) + score number
- Mandatory criteria show PASS/FAIL badges instead of scores
- Color coding matches score tier
- "Why this score" expand button opens a tooltip/popover with the agent's justification text

Section 4 — CV Preview:
- Embedded PDF viewer (use react-pdf library)
- If PDF rendering fails, show "Download original CV" button

**Right Panel — Candidate Chat:**

Chat window with:
- Header: "Ask about [Candidate Name]" + context indicator showing which profile is loaded
- Message history area (scrollable, dark background)
- Suggested questions (chips, pre-populated, clickable):
  - "What are the key gaps for this role?"
  - "Summarize leadership experience"
  - "How does this candidate compare to average shortlisted?"
  - "Are there any red flags?"
  - "Is this candidate likely overqualified?"
- Message input: expandable textarea + send button
- AI messages: left-aligned, dark card background, source references shown below as small tags
- User messages: right-aligned, accent background
- Loading state: animated three-dot typing indicator
- For mock: simulate a 1.5s delay then return a hardcoded response based on which suggested question was clicked

**Cross-Candidate Chat toggle:**
- Switch at top of chat panel: "This Candidate" / "Shortlist"
- When "Shortlist" is selected, the context indicator changes to "Asking about 8 shortlisted candidates"
- Suggested questions change to comparative ones

**Test Checklist:**
- [ ] Both panels render correctly
- [ ] Score breakdown accordion opens/closes
- [ ] "Why this score" popovers work for each criterion
- [ ] Contact reveal works (toggle redacted/shown state)
- [ ] Experience and education timelines render correctly
- [ ] PDF viewer renders (use a sample public PDF for testing)
- [ ] Suggested question chips send a message when clicked
- [ ] Mock AI response appears after simulated delay
- [ ] Chat panel switch between "This Candidate" and "Shortlist" works
- [ ] Chat input: Enter sends, Shift+Enter newline

---

### Page 6 — Compare View (Route: `/jobs/[id]/compare`)

**Purpose:** Side-by-side comparison of 2–4 shortlisted candidates.

**Layout:** Horizontal scroll container with one column per candidate. Fixed left column = criterion labels.

**Structure:**
```
                 | Candidate A | Candidate B | Candidate C |
Overall Score    |     88      |     71      |     65      |
─────────────────────────────────────────────────────────────
Degree Level     |  ✅ Master  |  ✅ Bachelor|  ✅ Bachelor |
Years Exp        |   ✅ 12 yr  |  ✅ 8 yr   |  ✅ 6 yr    |
PMP Cert         |     ✅      |     ✅      |     ❌      |
─────────────────────────────────────────────────────────────
AutoCAD          |   90 / 100  |   75 / 100  |   60 / 100  |
FIDIC Knowledge  |   85 / 100  |   70 / 100  |   50 / 100  |
─────────────────────────────────────────────────────────────
AI Summary       | [text...]   | [text...]   | [text...]   |
─────────────────────────────────────────────────────────────
Actions          | Shortlist   | Shortlist   | Shortlist   |
                 | WhatsApp    | WhatsApp    | WhatsApp    |
```

Score cells: background color interpolated by score (green at 100, red at 0)
Best value in each row: subtle highlight border

**Test Checklist:**
- [ ] Correct candidates from selection appear
- [ ] All criteria rows render
- [ ] Score cells color-coded correctly
- [ ] Best value highlighting works
- [ ] Horizontal scroll works on smaller viewports
- [ ] Action buttons work (shortlist/whatsapp)
- [ ] "Back to Results" navigation works

---

### Page 7 — WhatsApp Inbox (Route: `/whatsapp`)

**Purpose:** Manage all WhatsApp conversations initiated from the system.

**Layout:** Two-panel. Left (340px) = conversation list. Right = active conversation thread.

**Conversation List:**
- Search input at top
- Filter tabs: `[All] [Awaiting Reply] [Replied] [Screening Q's Sent]`
- Each conversation item:
  - Candidate avatar (initials fallback)
  - Candidate name
  - Job profile tag (small colored chip)
  - Last message preview (truncated)
  - Timestamp (relative: "2h ago", "Yesterday")
  - Unread indicator (green dot)
  - Status badge: Screening / Follow-up / Closed

**Conversation Thread:**
- Thread header: candidate name, job applied, phone number, score badge
- Message bubbles:
  - Outbound (right, indigo bubble): system-sent or recruiter-sent messages
  - Inbound (left, dark card): candidate replies
  - System events: centered, muted text — "Screening questions sent", "Candidate responded"
- Timestamp on each message
- Message input area (bottom):
  - Textarea
  - "AI Draft" button: generates a suggested reply (mock: 0.8s delay then show suggestion in input)
  - Send button
  - Template button: opens a popover with saved message templates
- Above input: "AI Draft" suggestion appears as a dismissible preview card

**Test Checklist:**
- [ ] Conversation list renders all mock threads
- [ ] Filter tabs correctly filter list
- [ ] Clicking a conversation loads the thread
- [ ] Message bubbles styled correctly (inbound vs outbound)
- [ ] "AI Draft" generates mock suggestion in input
- [ ] Template picker opens and inserts text
- [ ] Send clears input and adds message to thread (optimistic UI)
- [ ] Unread indicator clears when conversation is opened

---

### Global Components

**Navigation Bar (fixed top):**
- Logo: "TalentLens" in Syne font with a small geometric icon
- Main nav links: Dashboard, Jobs, WhatsApp, Settings
- Active state: accent underline + slightly brighter text
- Right: notification bell (with count badge) + user avatar + dropdown (Profile, Settings, Logout)
- Mobile: collapses to hamburger menu → full-screen slide-in nav

**Notification System:**
- Toast notifications (bottom-right) for: CV upload complete, scoring complete, WhatsApp reply received
- Use sonner library for toasts
- Notification bell dropdown shows last 5 notifications with read/unread state

**Loading States:**
- Every data surface must have a skeleton loader
- Skeleton must match the layout of the loaded content (not generic gray boxes)
- Use shimmer animation on skeletons

**Error States:**
- Every page must handle an error state gracefully
- Error card with icon, "Something went wrong" message, and "Try again" button
- Never show raw error messages to the user

**Empty States:**
- Every list/grid must have a designed empty state
- Custom SVG illustration + message + CTA per context

---

## ═══════════════════════════════════════
## PHASE 2 — BACKEND (START AFTER PHASE 1)
## ═══════════════════════════════════════

> ⚠️ Do not start Phase 2 until all Phase 1 test checklists pass and the frontend is reviewed.

### Backend Structure

```
/backend
  /api
    /routes
      jobs.py          # Job profile CRUD
      candidates.py    # Candidate CRUD, upload endpoint
      scoring.py       # Trigger scoring, get results
      chat.py          # RAG chat endpoint (SSE streaming)
      whatsapp.py      # Send message, webhook receiver
  /agents
    extractor.py       # Agent 1: CV extraction
    evaluator.py       # Agent 2: Criterion scoring
    critic.py          # Agent 3: Score validation
    summarizer.py      # Agent 4: Summary generation
  /services
    cv_processor.py    # PDF/DOCX parsing, OCR
    vector_store.py    # Qdrant operations
    graph_store.py     # Neo4j operations
    whatsapp.py        # Meta API client
    phone_normalizer.py
  /models
    database.py        # SQLAlchemy models
    schemas.py         # Pydantic schemas
  /workers
    scoring_worker.py  # ARQ async worker
  main.py
  config.py
```

### API Endpoints Required

**Jobs**
```
POST   /api/jobs                    # Create job profile
GET    /api/jobs                    # List all job profiles
GET    /api/jobs/{id}               # Get job profile
PUT    /api/jobs/{id}               # Update job profile
DELETE /api/jobs/{id}               # Archive job profile
GET    /api/jobs/{id}/stats         # Pipeline statistics
```

**Candidates**
```
POST   /api/jobs/{id}/upload        # Upload CVs (multipart)
GET    /api/jobs/{id}/candidates    # List candidates with scores
GET    /api/candidates/{id}         # Full candidate profile
PATCH  /api/candidates/{id}/status  # Update status (shortlist/reject)
```

**Scoring**
```
POST   /api/candidates/{id}/score   # Trigger scoring
GET    /api/candidates/{id}/score   # Get score details
```

**Chat**
```
POST   /api/chat/candidate          # Single candidate RAG query (SSE)
POST   /api/chat/shortlist          # Cross-candidate RAG query (SSE)
```

**WhatsApp**
```
POST   /api/whatsapp/send           # Send message to candidate
GET    /api/whatsapp/threads        # List all threads
GET    /api/whatsapp/threads/{id}   # Get thread messages
POST   /api/whatsapp/webhook        # Meta webhook receiver
POST   /api/whatsapp/draft          # Generate AI reply draft
```

### Database Schema (PostgreSQL)

```sql
-- Organizations (future multi-tenancy)
organizations (id, name, created_at)

-- Users
users (id, org_id, name, email, role, created_at)

-- Job Profiles
job_profiles (
  id, org_id, title, department, location,
  openings, status,
  mandatory_criteria JSONB,   -- {degree_required, min_degree_level, years_min, years_max, certs[], ...}
  preferred_criteria JSONB,   -- [{name, weight, type, options}]
  scoring_weights JSONB,      -- {criterion_id: weight}
  template_used,
  created_at, updated_at
)

-- Candidates
candidates (
  id, org_id,
  name, email, phone, phone_e164,
  nationality, date_of_birth,
  degree_level, degree_field, institution,
  years_experience, current_title, current_company,
  skills JSONB,         -- [{name, confidence}]
  languages JSONB,
  certifications JSONB,
  raw_cv_text TEXT,
  cv_file_path,
  extraction_confidence JSONB,  -- {field: confidence_score}
  created_at
)

-- Applications (candidate × job)
applications (
  id, candidate_id, job_profile_id,
  status,  -- uploaded|extracting|scoring|scored|shortlisted|rejected|eliminated
  final_score DECIMAL,
  elimination_reason TEXT,
  criterion_scores JSONB,   -- {criterion_id: {score, justification}}
  ai_summary TEXT,
  critic_flags JSONB,
  shortlisted_at, rejected_at,
  created_at, updated_at
)

-- WhatsApp Threads
whatsapp_threads (
  id, candidate_id, job_profile_id,
  phone_number, status,
  screening_sent_at, screening_responded_at,
  score_adjustment DECIMAL,
  created_at
)

-- WhatsApp Messages
whatsapp_messages (
  id, thread_id,
  direction,  -- inbound|outbound
  content TEXT,
  message_type,  -- template|free_text|screening|ai_draft
  wa_message_id,
  sent_at, delivered_at, read_at
)

-- Hiring Outcomes (feedback loop)
hiring_outcomes (
  id, application_id, job_profile_id,
  outcome,  -- hired|rejected_post_interview|withdrew|ghosted
  outcome_date,
  notes TEXT
)
```

---

## ═══════════════════════════════════════
## PHASE 3 — INTEGRATIONS
## ═══════════════════════════════════════

> ⚠️ Do not start Phase 3 until Phase 2 API endpoints are tested and working.

### Integration 1 — CV Extraction Agent (LangGraph)

**Model:** Claude claude-sonnet-4-6 (primary) | Qwen2.5-7B via Ollama (fallback)

**Input:** Raw text extracted from CV file
**Output:** Structured JSON with confidence scores per field

**Extraction prompt must:**
- Output valid JSON only (no markdown wrapping)
- Include confidence 0.0–1.0 per field
- Normalize phone to E.164 format
- Calculate years_experience from work history dates if not explicitly stated
- Flag date_of_birth extraction as optional (privacy sensitivity)

### Integration 2 — Agentic Scoring Pipeline (LangGraph)

**Four-node LangGraph graph:**

```
Extracted Data → [Hard Filter] → (if pass) → [Evaluator] → [Critic] → [Summarizer] → Scores
                      ↓ (if fail)
                   Eliminated
```

**Hard Filter Node:** Pure Python rule evaluation. No LLM. Checks mandatory criteria as boolean. Returns pass/fail + failing criteria list.

**Evaluator Node:** LLM call. System prompt configures it as a strict, criterion-by-criterion scorer. Outputs JSON: `{criterion_id: {score: 0-100, justification: "..."}}`

**Critic Node:** LLM call. Receives evaluator output + extracted data. Checks for inconsistencies. Returns: approved | flag_for_review | re_evaluate (with specific criteria to re-score).

**Summarizer Node:** LLM call. Writes 3-sentence summary. Grounded strictly in criterion scores and extracted data. No hallucination instruction in system prompt.

### Integration 3 — Qdrant Vector Store

**Collection per job profile:** `job_{job_id}_candidates`
**Each point:** candidate CV chunk with metadata: `{candidate_id, job_id, chunk_type, shortlist_status}`
**Embedding model:** nomic-embed-text via Ollama local API

**Operations needed:**
- Index candidate on scoring completion
- Filtered search by job_id + shortlist_status
- Delete candidate vectors when application is deleted
- Cross-candidate search with job_id filter

### Integration 4 — Neo4j Knowledge Graph

**Node types:** Person, Company, Role, Skill, Certification, Institution, Degree
**Edge types:** worked_at (with duration), held_role, has_skill, holds_cert, studied_at, earned_degree

**Graph built from:** structured extracted data after scoring
**Queried by:** RAG chat engine for structural/relational questions

### Integration 5 — RAG Chat Engine

**Query flow:**
1. Embed user query (nomic-embed-text)
2. Qdrant: retrieve top-K chunks (filtered by candidate/job scope)
3. Neo4j: parse query for graph intent, run Cypher if structural
4. Merge + rank results
5. Build context prompt with retrieved chunks as sources
6. Stream LLM response via SSE to frontend
7. Include source references in response

**Grounding system prompt:**
```
You are a recruitment analysis assistant. Answer ONLY based on the provided 
candidate documents. If information is not present in the documents, say so 
explicitly. Do not infer, estimate, or fabricate candidate attributes.
Sources: {retrieved_chunks}
```

### Integration 6 — WhatsApp Business API

**Setup requirements:**
- Meta Business Account
- WhatsApp Business Cloud API credentials
- Webhook URL for inbound messages (must be HTTPS)
- Message templates approved by Meta for first-contact outreach

**Outbound flow:**
1. Recruiter clicks WhatsApp button on candidate card
2. Frontend opens composer with pre-filled template
3. Recruiter confirms → POST /api/whatsapp/send
4. Backend calls Meta API with candidate phone_e164 + template
5. Meta delivers message, returns message_id
6. Status stored in whatsapp_messages

**Inbound webhook flow:**
1. Candidate replies → Meta sends POST to /api/whatsapp/webhook
2. Backend verifies webhook signature
3. Identifies candidate by phone number
4. Stores message in whatsapp_messages
5. Triggers WebSocket push to frontend (recruiter sees reply in real time)
6. If message matches screening Q's flow: routes to scoring update agent

---

## Project File Structure

```
/talentlens
├── /frontend                    # Next.js application
│   ├── /app
│   │   ├── /dashboard           # Route: /
│   │   ├── /jobs
│   │   │   ├── /new             # Job profile builder
│   │   │   └── /[id]
│   │   │       ├── /edit
│   │   │       ├── /upload
│   │   │       ├── /results
│   │   │       ├── /compare
│   │   │       └── /candidates
│   │   │           └── /[candidateId]
│   │   └── /whatsapp            # WhatsApp inbox
│   ├── /components
│   │   ├── /ui                  # shadcn components
│   │   ├── /jobs                # Job-specific components
│   │   ├── /candidates          # Candidate card, profile
│   │   ├── /chat                # Chat interface
│   │   ├── /whatsapp            # WhatsApp components
│   │   ├── /charts              # Score gauge, sparklines
│   │   └── /layout              # Nav, sidebar, shells
│   ├── /lib
│   │   ├── mock-data.ts         # All mock data
│   │   ├── api-client.ts        # API client (switch mock/real)
│   │   └── utils.ts
│   ├── /hooks                   # Custom React hooks
│   ├── /store                   # Zustand stores
│   └── /types                   # TypeScript types
│
├── /backend                     # FastAPI application
│   ├── /api
│   ├── /agents
│   ├── /services
│   ├── /models
│   ├── /workers
│   └── main.py
│
├── /infrastructure
│   ├── docker-compose.yml       # Local dev: postgres, redis, qdrant, neo4j, ollama
│   └── .env.example
│
└── README.md
```

---

## API Client Architecture (Critical for Phase Transition)

Build the API client from day one with a **mock/real switch**:

```typescript
// /lib/api-client.ts
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export const apiClient = {
  jobs: {
    list: () => USE_MOCK ? mockApi.jobs.list() : realApi.jobs.list(),
    create: (data) => USE_MOCK ? mockApi.jobs.create(data) : realApi.jobs.create(data),
    // ...
  },
  candidates: { ... },
  chat: { ... },
  whatsapp: { ... }
}
```

The mock API must simulate realistic delays (300–800ms for lists, 1.5–4s for AI operations). When Phase 2 is ready, flipping `USE_MOCK=false` in the environment is the only change needed to connect to the real backend.

---

## Environment Variables

```bash
# Frontend
NEXT_PUBLIC_USE_MOCK=true              # true during Phase 1, false in Phase 2+
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
NEO4J_URL=bolt://localhost:7687
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_BASE_URL=http://localhost:11434
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_ID=...
WHATSAPP_VERIFY_TOKEN=...
```

---

## Phase 1 Completion Criteria

Before ANY backend work begins, the following must all be true:

- [ ] All 7 pages render correctly with mock data
- [ ] All interactive elements (toggles, sliders, chips, forms) work correctly
- [ ] All navigation between pages works
- [ ] All filter/sort operations work client-side
- [ ] All loading states (skeletons) show during simulated data fetch delays
- [ ] All empty states are designed and render correctly
- [ ] All error states are designed and render correctly
- [ ] Score gauges render correctly at all score values
- [ ] Chat interface mock responses work
- [ ] WhatsApp inbox mock conversations work
- [ ] Responsive layout correct at 1280px, 768px, 375px
- [ ] No TypeScript errors (`tsc --noEmit` passes clean)
- [ ] No console errors in browser during normal usage
- [ ] Lighthouse performance score > 85 on desktop
- [ ] All test checklist items on each page are checked off

---

## Development Commands

```bash
# Start frontend development
cd frontend && npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Start all backend services (Phase 2+)
docker-compose up -d

# Start backend API (Phase 2+)
cd backend && uvicorn main:app --reload

# Start scoring worker (Phase 2+)
cd backend && arq workers.scoring_worker.WorkerSettings
```

---

## Notes for Claude Code

1. **Build sequentially** — complete each page fully before moving to the next
2. **Mock data is real data** — write mock-data.ts with the same structure as the real API response schemas. This makes the Phase 1→2 transition seamless
3. **TypeScript strictly** — no `any` types. Define all interfaces in `/types`
4. **Component granularity** — break components when they exceed ~150 lines. Keep components focused on one responsibility
5. **Score Gauge is critical** — invest time in making the SVG arc score gauge pixel-perfect. It appears on every candidate-facing surface and is the first thing a recruiter sees
6. **Animations are intentional** — use Framer Motion only for meaningful transitions (page entry, card hover, status changes). Do not animate decoratively
7. **The weight allocation panel (Step 4 of Job Builder) is the most complex UI component** — build it last within the job builder, after all other steps are working
8. **Chat streaming** — in Phase 1 mock, simulate streaming by revealing AI response text character-by-character (typewriter effect at ~30 chars/second). This trains the user expectation for Phase 2 real streaming
9. **shadcn/ui setup** — initialize with `npx shadcn@latest init` before building. Use `dark` theme as base. Customize CSS variables in `globals.css` to match TalentLens color system
10. **Start with the layout shell** — build the navigation and page layout wrapper before any page content. Every page inherits from this shell
