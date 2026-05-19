# Technical Document — CartCoroner AI

**Architecture, Pipeline, and Implementation Reference**

---

## 1. System Architecture

CartCoroner is a distributed, event-driven system composed of four main layers:

```text
1. Shopify Storefront  (theme.liquid — vanilla JS tracker)
        │  async behavioral events (fetch with keepalive: true)
        ▼
2. FastAPI Backend  (Python 3.11 — Hugging Face Spaces, Docker)
        │  persist raw events   │  inference requests
        ▼                       ▼
3. Supabase PostgreSQL      4. Groq API
(session_events, diagnoses)  (LLaMA 3.3 70B Versatile)
        │
        ▼
5. Next.js Dashboard  (Vercel — Edge CDN)
        (Fetches materialized insights from backend via REST)
```

**Data Flow:**
1. The JS tracker on Shopify captures DOM events and sends them to the FastAPI backend.
2. The backend immediately writes raw events to Supabase (`session_events` table).
3. Upon a `session_abandoned` event (triggered via `beforeunload` or inactivity), the backend retrieves the session's full event history.
4. The backend formats this timeline into a prompt context and queries the Groq API.
5. The LLM returns a structured JSON diagnosis, which is persisted in the `diagnoses` table.
6. The Vercel-hosted frontend polls the backend to display the live feed and session replays.

---

## 2. Key Implementation Decisions

- **Custom `SupabaseHTTP` Client:** We bypassed the official `supabase-py` SDK and built a lightweight REST client using `httpx`. The official SDK crashed when handling modern `sb_publishable_*` keys required by newer Supabase projects. The custom client ensures deployment stability on Hugging Face Spaces.
- **`keepalive: true` for Event Transmission:** Standard `fetch` requests are often cancelled by the browser during a tab close or navigation. We use the `keepalive` flag on the final `session_abandoned` payload to ensure the browser finishes transmitting the data in the background.
- **SHA-256 Diagnosis Caching:** We hash identical cart patterns (value bucket + categories + drop-off step) and cache the LLM response for 24 hours. This drastically reduces Groq API calls for common abandonment scenarios, preserving quota for complex, session-specific behavioral trajectories.

---

## 3. The Boundary: AI vs. Deterministic Code

Where do we draw the line between standard code and Large Language Models?

**Deterministic Code Handles:**
- Event capture, filtering (e.g., ignoring hovers < 500ms), and state persistence.
- Aggregating session timelines and calculating derived metrics (e.g., total duration, max cart value, variant switch counts).
- Routing, database caching, and cache invalidation.
- **Fallback logic:** If a cart's behavior is trivial (e.g., immediate bounce), deterministic code handles it to save LLM costs.

**AI/LLM Handles:**
- **Pattern Recognition & Nuance:** The LLM receives the derived metrics and the raw timeline. It is responsible for contextual reasoning. E.g., Did the user switch variants 5 times because they were confused, or were they just browsing quickly? The LLM looks at time-between-actions to make this judgment.
- **Actionable Fix Generation:** Synthesizing the specific context into a human-readable recommendation for the merchant.

*Why this boundary?* LLMs are too slow and expensive for event routing or basic aggregation. We use deterministic code to compress the data into a high-signal prompt, and only use the LLM where its fuzzy logic and reasoning capabilities are strictly necessary.

---

## 4. Failure Handling & Degradation

What happens when things break? We designed the system to degrade gracefully.

**1. Shopify Storefront / Tracker Network Failure**
- If the backend is unreachable from the client, `fetch` calls fail silently in the background. The `catch` block prevents JavaScript errors from leaking into the merchant's storefront, ensuring the shopping experience is never impacted by telemetry failures.

**2. Groq API Down / Rate Limited**
- If the LLM call times out or returns a 5xx error, the backend catches the exception and routes the payload to `fallback_diagnosis()`. 
- This deterministic function uses hardcoded heuristics (e.g., if step == "shipping", return `SHIPPING_SURPRISE`; if step == "payment" and value > 3000, return `PRICE_SHOCK`). 
- The system continues to populate the dashboard with insights, albeit with lower nuance.

**3. LLM Returns Malformed JSON / Hallucinates Categories**
- We force `response_format: {"type": "json_object"}` on the Groq call.
- If the parsed JSON is missing fields or hallucinated an invalid `root_cause` outside our predefined enums, the backend parser validates it against a strict whitelist. If it fails validation, it reverts to the deterministic fallback.

**4. Supabase DB Unreachable**
- The FastAPI backend returns 500s for read queries, and the Next.js frontend displays empty states for charts rather than crashing. 
- Ingestion events are dropped.

---

## 5. Known Limitations & Future Improvements

**Current Limitations:**
- **Session Stitching:** The current tracker uses `localStorage` for session IDs, meaning cross-device tracking (user starts on mobile, finishes on desktop) is impossible. 
- **In-Memory Cache:** The current caching layer relies on Supabase. Under extreme load, a dedicated Redis layer would be required for the cache fingerprinting.
- **DOM Brittleness:** The tracker relies on specific Shopify CSS selectors (`name="id"`, `.step[data-step]`) which might break on highly customized headless Shopify themes.

**What We Would Improve With More Time:**
1. **Queueing System:** Currently, webhook and event processing are handled synchronously or via basic FastAPI background tasks. We would implement Celery + Redis to queue LLM inferences and handle rate limiting properly.
2. **Predictive Scoring:** We would train a lightweight deterministic model to assign an "abandonment probability score" in real-time as events stream in, triggering on-page interventions *before* the user closes the tab.
3. **Mutation Observers:** Upgrade the JS tracker to use `MutationObserver` to more robustly detect checkout state changes on single-page-application (SPA) storefronts without relying on URL paths.
