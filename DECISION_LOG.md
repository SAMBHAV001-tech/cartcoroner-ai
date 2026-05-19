# Decision Log — CartCoroner AI

Engineering decisions, tradeoffs, and rationale behind the CartCoroner architecture.

---

## ADR-001 · Real Behavioral Telemetry Over Synthetic AI Demos

**Decision:** Capture real storefront interaction events from an actual Shopify storefront rather than generating synthetic cart data for demos.

**Rationale:**
Most AI commerce tools at the demo stage use hardcoded or LLM-hallucinated data to simulate behavioral intelligence. This creates a fundamental credibility gap — the AI is reasoning about data that was never real.

CartCoroner's value proposition is forensic diagnosis. Forensics requires real evidence. We inject a 294-line vanilla JS tracker (`cartcoroner-tracker.liquid`) directly into the Shopify `theme.liquid`, capturing:
- Variant toggle events (`variant_changed`)
- Checkout funnel progression (`checkout_step_reached`)
- Shipping section interaction dwell time (`shipping_section_viewed`)
- Back-navigation patterns (`page_revisit`)
- Tab-close and inactivity abandonment (`session_abandoned`)

Every AI diagnosis shown in the dashboard traces back to a real session stored in Supabase. This is not a simulation.

**Tradeoff accepted:** Setup requires access to a Shopify storefront. For judges without a live store, we provide pre-captured real session data in Supabase that the dashboard loads automatically.

---

## ADR-002 · FastAPI (Python) Over a Node.js Backend

**Decision:** Use FastAPI with Python 3.11 rather than Express or a Node-based backend.

**Rationale:**

1. **Groq SDK compatibility.** The Groq client is initialized via the OpenAI Python SDK (`openai` package pointed at `https://api.groq.com/openai/v1`). Python is the canonical runtime for this integration.

2. **Pydantic validation.** The diagnosis pipeline requires strict structural guarantees on cart payloads and AI responses. FastAPI's native Pydantic v2 integration handles this without additional middleware.

3. **Built-in OpenAPI.** FastAPI generates interactive Swagger docs (`/docs`) automatically from type annotations — no extra tooling. For a hackathon, this eliminates time spent on API documentation.

4. **Hugging Face Spaces.** HF Spaces has first-class support for Docker + Python. A FastAPI app in a Docker container is the standard deployment pattern there.

**Tradeoff accepted:** An additional runtime boundary exists between the Next.js frontend (Node/Vercel) and the Python backend (Docker/HF Spaces). CORS middleware handles cross-origin requests.

---

## ADR-003 · Supabase (PostgreSQL) Over MongoDB

**Decision:** Use Supabase as the primary database rather than MongoDB Atlas or Firebase.

**Rationale:**

1. **Relational integrity matters here.** `session_events` → `diagnoses` → `abandoned_carts` is a structured, join-able schema. PostgreSQL's foreign keys and indexed queries are more appropriate than document-store flexibility.

2. **REST API without an extra layer.** Supabase exposes a PostgREST REST API at `/rest/v1/<table>` automatically. We wrote a custom `SupabaseHTTP` client (`main.py:34-80`) that talks directly to this API over `httpx`. This avoided a hard dependency on the official Supabase Python SDK, which crashes on modern `sb_publishable_*` key formats.

3. **Managed PostgreSQL with zero ops.** No connection pooling configuration, no replica management. Supabase handles it.

4. **RPC functions.** The `/patterns` endpoint calls a Supabase RPC function (`get_patterns()` in `schema.sql`) that aggregates root-cause stats, cart value buckets, and abandonment step distributions in a single DB-side query. This would be significantly more complex in MongoDB's aggregation pipeline.

**Tradeoff accepted:** Supabase free tier has row limits and connection caps. At scale, a dedicated PostgreSQL instance on Railway or RDS would be the migration path.

---

## ADR-004 · Groq for AI Inference Over OpenAI / Anthropic

**Decision:** Use Groq API (LLaMA 3.3 70B Versatile) rather than GPT-4o or Claude.

**Rationale:**

1. **Inference speed.** Groq's LPU hardware returns 70B-parameter model completions in ~500ms. GPT-4o averages 2-4 seconds for equivalent prompts. For a live diagnosis feed that users interact with in real-time, this matters.

2. **JSON mode.** Groq supports `response_format: {"type": "json_object"}` natively. The diagnosis endpoint expects a strictly structured JSON response (`root_cause`, `confidence`, `evidence[]`, `fix`, `impact_inr`). Structured output removes the need for regex extraction or retry loops.

3. **Cost profile.** LLaMA 3.3 70B on Groq is priced significantly below GPT-4o at equivalent token throughput.

4. **OpenAI-compatible SDK.** Groq's API is OpenAI-compatible, so we initialize it as `OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY)`. No Groq-specific SDK needed.

**Fallback implemented:** If Groq is unavailable or throws, `fallback_diagnosis()` applies deterministic heuristics (step + cart value) to return a degraded but valid response. The system never returns a 500 to the client on AI failure.

---

## ADR-005 · Custom Supabase HTTP Client Over Official SDK

**Decision:** Replace `supabase-py` with a custom `SupabaseHTTP` class built on `httpx`.

**Context:** The official `supabase-py` SDK validated API keys on initialization and rejected `sb_publishable_*` format keys (introduced by Supabase for modern projects). This caused the HuggingFace Spaces deployment to crash on startup before serving a single request.

**Decision:** Write a minimal REST client (`SupabaseHTTP`) that makes raw HTTP calls to the PostgREST API. It supports `select`, `insert`, and `rpc` operations — everything the backend requires.

**Tradeoff accepted:** We lose the SDK's realtime subscriptions and auto-generated type definitions. These features are not used in this version.

---

## ADR-006 · Vercel + Hugging Face Spaces Deployment

**Decision:** Deploy frontend on Vercel and backend on Hugging Face Spaces, rather than a single PaaS (Render, Railway, Fly.io) or a cloud VM.

**Rationale:**

| Layer | Platform | Reason |
|-------|----------|--------|
| Frontend | Vercel | Zero-config Next.js deployment. Edge CDN. Branch preview URLs. Free tier sufficient. |
| Backend | HF Spaces | Free persistent Docker container hosting. No cold-start penalty on the free tier at low traffic. Python 3.11 + port 7860 is the standard HF pattern. |
| Database | Supabase | Fully managed. No compute to provision. |

Splitting frontend and backend allows each layer to scale independently. Vercel handles frontend caching and CDN distribution; HF Spaces handles stateful AI inference requests.

**Tradeoff accepted:** Cross-origin requests between Vercel (`.vercel.app`) and HF Spaces (`.hf.space`) require CORS to be explicitly configured — handled with `CORSMiddleware(allow_origins=["*"])` in FastAPI.

---

## ADR-007 · Shopify Liquid for Tracker Injection

**Decision:** Deliver the behavioral tracker as a Shopify Liquid snippet injected into `theme.liquid` rather than a Shopify App or a third-party tag manager.

**Rationale:**

1. **No app permissions required.** A Liquid snippet runs in the storefront's own context. It doesn't need OAuth, webhook registration, or App Bridge integration.

2. **Direct DOM access.** Variant selectors, shipping fields, and checkout step indicators are accessed via native DOM queries. This is only possible from within the storefront's JavaScript context.

3. **`keepalive: true` on abandonment events.** The tracker uses `fetch(..., { keepalive: true })` on the `beforeunload` event to ensure the `session_abandoned` event transmits before the browser terminates the page. This is not possible from outside the storefront context.

4. **sessionId persistence via `localStorage`.** The tracker maintains a stable `cc_session_id` across page navigations within the same browser session without requiring server-side session management.

---

## ADR-008 · Diagnosis Cache by Cart Fingerprint

**Decision:** Cache AI diagnoses in the `diagnoses` table keyed by a SHA-256 hash of (`cart_value_bucket`, `product_categories`, `abandonment_step`), with a 24-hour TTL.

**Rationale:** Running a LLaMA 70B inference for every identical cart pattern is wasteful. Carts with similar value ranges, product categories, and abandonment steps will receive statistically equivalent diagnoses. The cache reduces Groq API calls for common patterns while preserving per-session accuracy for real telemetry-driven diagnoses (`/session/{id}/diagnose` always runs fresh).

---

## ADR-009 · Dual Diagnosis Paths

**Decision:** Maintain two separate diagnosis flows — `POST /diagnose` (webhook/manual) and `POST /session/{id}/diagnose` (telemetry-driven).

**Rationale:** The webhook flow works with structured Shopify cart payload data (product IDs, cart value, abandonment step). The telemetry flow works with raw behavioral events (a time-ordered list of `session_events`). Both paths ultimately call Groq with different prompt contexts:

- Webhook path: structured cart attributes → classification prompt
- Session path: event timeline + derived signals (variant count, revisit count, shipping dwell) → forensic analysis prompt

Keeping them separate preserves the integrity of each signal type and allows the dashboard to surface both demo-mode diagnoses and real-session diagnoses simultaneously.
