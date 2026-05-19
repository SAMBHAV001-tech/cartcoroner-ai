# Technical Document — CartCoroner AI

**Architecture, Pipeline, and Implementation Reference**

---

## Architecture Overview

CartCoroner is a four-layer distributed system:

```
Shopify Storefront  (theme.liquid — vanilla JS tracker)
        │  behavioral events (HTTP POST, keepalive)
        ▼
FastAPI Backend  (Python 3.11 — Hugging Face Spaces, Docker)
        │  persist events       │  AI inference
        ▼                       ▼
Supabase PostgreSQL         Groq API
(session_events, diagnoses,  (LLaMA 3.3 70B Versatile)
 abandoned_carts)
        │
        ▼
Next.js Dashboard  (Vercel — Edge CDN)
```

Each layer has a single responsibility. The Shopify tracker only captures and forwards. The FastAPI backend owns all business logic. Supabase is the system of record. The dashboard is read-only — it fetches and visualizes.

---

## Telemetry Pipeline

### Tracker Initialization

The tracker snippet (`scripts/cartcoroner-tracker.liquid`) initializes once per page load via an IIFE with a guard flag (`window.CartCoronerTracker`). On first run, it generates or retrieves a persistent session ID from `localStorage`:

```js
sid = 'cc_session_' + Math.random().toString(36).substring(2, 15) + ...
localStorage.setItem('cc_session_id', sid);
```

The session ID survives page-to-page navigation within the same browser session. It resets only when `localStorage` is cleared.

### Event Capture

Five event modules initialize on `DOMContentLoaded`:

**`trackVariantChanges()`** — Listens to `change` events on form elements matching Shopify variant selector heuristics (`name="id"`, `name="options"`, `.single-option-selector`). Also handles swatch-based selectors via click detection with a 50ms DOM-settle delay.

**`trackShippingView()`** — Uses `mouseover`/`mouseout` listeners on elements matching `[id*="shipping"]` or `[class*="shipping"]` CSS selectors. Records dwell time. Fires `shipping_section_viewed` only when dwell exceeds 500ms — filters out accidental hover.

**`trackCheckoutStep()`** — Inspects `window.location.pathname` and Shopify's `.step[data-step]` DOM markers to identify the current checkout stage (`cart`, `checkout_information`, `shipping`, `payment`). Persists last step to `localStorage`.

**`trackPageRevisit()`** — Uses `performance.getEntriesByType('navigation')` to detect `back_forward` navigation type. Cross-references with last-known page from `localStorage`.

**`setupAbandonmentTracking()`** — Attaches a `beforeunload` listener. Also implements an inactivity timeout (default: 5 minutes) that fires `session_abandoned` with `reason: 'inactivity'`. Inactivity timer resets on any of: `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`.

### Event Transmission

All events are sent as `POST` requests to `POST /session/event`:

```json
{
  "session_id": "cc_session_abc123",
  "event_type": "variant_changed",
  "timestamp": "2026-05-19T07:30:00.000Z",
  "page_url": "https://store.myshopify.com/products/t-shirt",
  "cart_value": 1499.0,
  "metadata": { "from_variant": "S", "to_variant": "M", "product_id": "7891234" }
}
```

The abandonment event uses `keepalive: true` to ensure delivery even when the browser is closing the tab.

---

## Frontend Architecture

**Framework:** Next.js (App Router, TypeScript)  
**Styling:** Tailwind CSS v4 + custom CSS design system in `globals.css`  
**Charts:** Recharts  
**Icons:** Lucide React  
**Deployment:** Vercel

### Component Structure

```
frontend/
├── app/
│   ├── page.tsx              # Root dashboard (server component)
│   ├── layout.tsx            # Root layout + metadata
│   └── globals.css           # Design system tokens + animations
├── components/dashboard/
│   ├── header.tsx            # Nav bar + live status indicator
│   ├── metric-cards.tsx      # KPI summary cards
│   ├── live-diagnosis-feed.tsx   # Real-time AI diagnosis list (client)
│   ├── live-session-monitor.tsx  # Session replay timeline (client)
│   ├── insights-panel.tsx    # Right sidebar AI insights
│   ├── charts.tsx            # Recharts visualizations
│   └── footer.tsx
├── lib/
│   └── mock-data.ts          # Fallback display data
└── hooks/                    # Custom React hooks
```

### Data Flow

`page.tsx` is a server component — it renders the shell with mock data immediately. `LiveDiagnosisFeed` and `LiveSessionMonitor` are client components that fetch live data from the FastAPI backend on mount via `useEffect`. This pattern ensures a fast initial render (no loading state on SSR) while live data hydrates asynchronously.

The dashboard contacts these backend endpoints:
- `GET /session/latest` — fetch most recent session ID
- `GET /session/{id}/events` — load event timeline for session replay
- `POST /session/{id}/diagnose` — trigger AI diagnosis on the session
- `GET /diagnoses` — load the last 50 diagnoses for the feed
- `POST /diagnose` — run a demo diagnosis from a scenario button

---

## Backend Architecture

**Framework:** FastAPI (Python 3.11)  
**Server:** Uvicorn  
**AI Client:** OpenAI SDK pointed at Groq's API endpoint  
**DB Client:** Custom `SupabaseHTTP` class over `httpx`  
**Deployment:** Docker on Hugging Face Spaces (port 7860)

### Request Handling

FastAPI routes are defined in `main.py`. All routes are async. CORS is open (`allow_origins=["*"]`) to permit calls from Vercel and Shopify storefront origins.

### Diagnosis Logic

`get_diagnosis_logic()` is the core function:

1. Compute a SHA-256 cache key from `(cart_value_bucket, sorted_categories, abandonment_step)`
2. Query `diagnoses` table for a matching cache entry within the last 24 hours
3. If cache hit: return cached result — no Groq call
4. If cache miss: construct structured prompt and call Groq with `response_format: json_object`
5. On Groq failure: call `fallback_diagnosis()` (deterministic heuristics)

Session-based diagnosis (`/session/{id}/diagnose`) derives signals from raw events before calling Groq:
- `variant_changed_count` — number of variant switches
- `page_revisit_count` — number of back-navigations
- `has_shipping_viewed` — boolean
- `last_active_step` — final checkout stage reached
- `total_duration_seconds` — session length
- `max_cart_value` — peak cart value across all events

These signals form the Groq prompt context alongside the full event timeline.

### System Prompt (Diagnosis)

```
You are CartCoroner AI, a behavioral revenue intelligence engine for Shopify merchants.
Diagnose abandoned carts and classify into ONE root cause:
1. PRICE_SHOCK — high cart value, payment-step drop-off, budget hesitation
2. SHIPPING_SURPRISE — abandonment at shipping step, unexpected delivery costs
3. TRUST_GAP — high value purchase, hesitation about safety/trust
4. VARIANT_CONFUSION — fashion products, repeated size/variant toggling
5. JUST_BROWSING — low value, short session, weak purchase intent

Return ONLY valid JSON:
{"root_cause": "...", "confidence": float, "evidence": [string, string, string], "fix": string, "impact_inr": integer}
```

Temperature is set to `0.1` for consistent, reproducible classification.

---

## Supabase Schema

### `abandoned_carts`
Stores structured cart data from Shopify webhook payloads.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `cart_value` | FLOAT | Total cart value |
| `product_categories` | JSONB | Product category list |
| `customer_email` | TEXT | Nullable |
| `abandonment_step` | TEXT | `cart` / `shipping` / `payment` |
| `created_at` | TIMESTAMPTZ | Default: now() |

### `session_events`
Stores real-time behavioral events from the Shopify tracker.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `session_id` | TEXT | `localStorage` session key |
| `event_type` | TEXT | One of 5 event types |
| `metadata` | JSONB | Event-specific payload |
| `page_url` | TEXT | URL at time of event |
| `cart_value` | DECIMAL | Cart value at event time |
| `timestamp` | TIMESTAMPTZ | Client-side ISO timestamp |

**Indexes:** `idx_session_events_session_id` (for per-session fetches), `idx_session_events_created_at_desc` (for latest session lookup).

### `diagnoses`
Stores all AI diagnosis outputs, from both webhook and session paths.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `cart_id` | UUID | FK → `abandoned_carts` (nullable) |
| `session_id` | TEXT | For session-path diagnoses |
| `cache_key` | TEXT | SHA-256 fingerprint |
| `root_cause` | TEXT | One of 5 root cause codes |
| `confidence` | FLOAT | 0.55–0.95 |
| `evidence` | JSONB | Array of 3 evidence strings |
| `fix` | TEXT | Actionable recommendation |
| `impact_inr` | INT | Revenue recovery estimate |
| `source` | TEXT | `webhook` or `real_session` |

**Index:** `idx_diagnoses_cache_key` (for 24-hour cache lookup).

### `get_patterns()` RPC

A PostgreSQL function that returns aggregate analytics in a single query:
- `root_cause_stats` — count + avg impact per root cause
- `cart_value_stats` — session count per value bucket (`0-1000`, `1000-3000`, etc.)
- `abandonment_step_stats` — session count per funnel stage

---

## AI Diagnosis Flow

```
Client: POST /session/{id}/diagnose
        │
        ▼
Fetch all events for session_id from session_events
        │
        ▼
Derive signals:
  - variant_changed_count
  - page_revisit_count
  - has_shipping_viewed
  - last_active_step
  - total_duration_seconds
  - max_cart_value
        │
        ├──► Groq available?
        │         │ YES
        │         ▼
        │    Build context string + event timeline
        │    POST https://api.groq.com/openai/v1/chat/completions
        │    model: llama-3.3-70b-versatile
        │    max_tokens: 400, temperature: 0.1
        │    response_format: json_object
        │         │
        │         ▼
        │    Parse JSON → root_cause, confidence, evidence, fix, impact_inr
        │
        └──► Groq unavailable? → fallback_diagnosis() heuristics
                │
                ▼
        INSERT into diagnoses (source: 'real_session')
                │
                ▼
        Return DiagnosisRealResponse to client
```

---

## Deployment Architecture

### Frontend — Vercel

- Next.js builds are deployed automatically on `git push` to `main`
- Vercel Edge CDN distributes the static shell globally
- Environment variable `NEXT_PUBLIC_API_URL` points to the HF Spaces backend URL

### Backend — Hugging Face Spaces

- Docker container built from `backend/Dockerfile` (Python 3.11 slim)
- Container starts Uvicorn on port 7860 (HF Spaces standard)
- Environment secrets (`GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`) set in HF Spaces settings
- No cold-start penalty on the HF free tier for persistent Docker spaces

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Database — Supabase

- Managed PostgreSQL instance on Supabase Cloud
- Schema provisioned via `backend/schema.sql`
- Accessed via direct REST API (PostgREST) — no connection pooler required at current traffic

---

## API Overview

Full interactive docs: [samd444-cartcoroner-backend.hf.space/docs](https://samd444-cartcoroner-backend.hf.space/docs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service status + Supabase/Groq connectivity |
| `POST` | `/diagnose` | AI diagnosis from structured cart payload |
| `POST` | `/recovery` | Generate personalized recovery message from diagnosis |
| `GET` | `/diagnoses` | Latest 50 diagnoses with cart data joined |
| `GET` | `/patterns` | Aggregated behavioral analytics (via RPC) |
| `POST` | `/webhook/shopify` | Shopify abandonment webhook (HMAC-verified) |
| `POST` | `/session/event` | Ingest real-time storefront telemetry event |
| `GET` | `/session/latest` | Most recent active session ID |
| `GET` | `/session/{id}/events` | Full event timeline for a session |
| `POST` | `/session/{id}/diagnose` | AI forensic diagnosis from real session telemetry |

### Authentication

The Shopify webhook endpoint (`/webhook/shopify`) validates the `X-Shopify-Hmac-Sha256` header using HMAC-SHA256 against `SHOPIFY_WEBHOOK_SECRET`. All other endpoints are public (appropriate for a demo/hackathon context; production would add API key auth).

---

## Real-Time Session Replay

The `LiveSessionMonitor` component:

1. On mount, calls `GET /session/latest` to retrieve the most recent `session_id`
2. Calls `GET /session/{id}/events` to fetch the full event timeline
3. Renders events as a chronological timeline sorted by `timestamp`
4. Displays event type, metadata, page URL, and cart value at each step
5. User can trigger `POST /session/{id}/diagnose` from the UI to run an AI autopsy on the displayed session

This gives merchants a lightweight session replay without video recording. The behavioral sequence (what the shopper did and in what order) is sufficient for root-cause diagnosis.

---

## Scalability Considerations

**Current state:** Suitable for small-to-medium Shopify stores (hundreds of sessions/day). Supabase free tier handles this comfortably.

**Bottlenecks at scale:**

| Layer | Bottleneck | Migration Path |
|-------|-----------|---------------|
| Backend | Single Uvicorn process on HF Spaces | Railway/Fly.io with Gunicorn multi-worker + autoscaling |
| Database | Supabase free tier row limits | Supabase Pro or self-hosted PostgreSQL on RDS |
| AI Inference | Groq rate limits at high concurrency | Groq paid plan; add request queuing with Celery/Redis |
| Telemetry ingestion | Synchronous DB writes per event | Batch write via Redis queue → periodic flush |

**Caching effectiveness:** The SHA-256 cache key reduces Groq calls significantly for stores with repeated cart patterns. Real-session diagnoses (`/session/{id}/diagnose`) bypass the cache by design — each session's telemetry is unique.

**Frontend performance:** The Next.js shell renders immediately from server with mock data. Live data hydrates asynchronously. No blocking API calls on the critical render path.
