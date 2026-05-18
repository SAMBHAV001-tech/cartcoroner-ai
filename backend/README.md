---
title: CartCoroner AI — Backend API
emoji: 🔬
colorFrom: green
colorTo: gray
sdk: docker
pinned: true
license: mit
short_description: FastAPI backend for CartCoroner AI — behavioral cart abandonment diagnostics powered by Groq LLaMA-3.3-70B and Supabase.
---

# CartCoroner AI — Backend API

> **Behavioral Revenue Intelligence Engine for Shopify**
> Powered by Groq LLaMA-3.3-70B · FastAPI · Supabase · Python 3.11

---

## What This Does

CartCoroner is an AI-powered forensic analysis tool that diagnoses *why* customers abandon their Shopify carts. This backend API:

- Receives **Shopify webhook events** on cart abandonment
- Captures **real-time storefront behavioral telemetry** (variant changes, shipping views, page revisits, session abandonment)
- Runs **Groq LLaMA-3.3-70B inference** to classify the root cause of abandonment
- Persists events and diagnoses to **Supabase**
- Exposes structured JSON endpoints for the CartCoroner dashboard frontend

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check — returns `status: ok` |
| `POST` | `/diagnose` | Submit a cart payload for AI diagnosis |
| `POST` | `/recovery` | Generate a personalized recovery message |
| `GET` | `/diagnoses` | Fetch all diagnoses (latest 50) |
| `GET` | `/patterns` | Aggregate abandonment pattern analytics |
| `POST` | `/webhook/shopify` | Receive Shopify checkout abandonment webhooks |
| `POST` | `/session/event` | Ingest a single storefront telemetry event |
| `GET` | `/session/latest` | Get the most recent session ID |
| `GET` | `/session/{id}/events` | Fetch all events for a session |
| `POST` | `/session/{id}/diagnose` | AI diagnosis from real session telemetry |

---

## Root Cause Categories

The AI classifies every abandonment into one of five behavioral patterns:

| Code | Label | Trigger |
|------|-------|---------|
| `PRICE_SHOCK` | Budget Resistance | High cart value, payment-step drop-off |
| `SHIPPING_SURPRISE` | Delivery Friction | Abandonment after viewing shipping rates |
| `TRUST_GAP` | Confidence Breakdown | Review/return-policy interactions before exit |
| `VARIANT_CONFUSION` | Decision Paralysis | Repeated size/variant toggling in fashion |
| `JUST_BROWSING` | Low Purchase Intent | Short session, low cart value, no friction signals |

---

## Environment Variables

Set these as **Space Secrets** in HuggingFace (Settings → Variables and Secrets):

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq Cloud API key — get one at [console.groq.com](https://console.groq.com) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase publishable/service key |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook HMAC secret for payload validation |
| `SHOPIFY_STORE_URL` | Your Shopify store URL (e.g. `yourstore.myshopify.com`) |
| `SHOPIFY_API_KEY` | Shopify API key (optional, for admin API calls) |
| `SHOPIFY_API_SECRET` | Shopify API secret (optional) |

> ⚠️ **Never commit real secrets to the repository.** Always use HuggingFace Space Secrets.

---

## Deployment (HuggingFace Spaces — Docker)

This Space uses the **Docker SDK**. The container:

1. Starts a Python 3.11-slim image
2. Installs dependencies from `requirements.txt`
3. Runs `uvicorn main:app --host 0.0.0.0 --port 7860`

HuggingFace Spaces automatically maps port `7860` — no configuration needed.

### Steps to Deploy

```bash
# 1. Create a new Space on huggingface.co
#    SDK: Docker | Hardware: CPU Basic (free)

# 2. Clone your HF Space repo
git clone https://huggingface.co/spaces/YOUR_USERNAME/cartcoroner-api

# 3. Copy backend files into the Space repo
cp -r backend/* cartcoroner-api/

# 4. Add your secrets via the HF Space Settings UI
#    (never push .env files)

# 5. Push to deploy
cd cartcoroner-api
git add -A
git commit -m "deploy: CartCoroner backend"
git push
```

The Space will build and be live at:
`https://YOUR_USERNAME-cartcoroner-api.hf.space`

---

## Tech Stack

```
FastAPI          — ASGI web framework
Uvicorn          — ASGI server (port 7860 for HF Spaces)
Groq + LLaMA-3.3-70b  — AI inference for behavioral diagnosis
Supabase         — PostgreSQL persistence + real-time events
python-dotenv    — Environment variable management
httpx            — Async HTTP client
pydantic v2      — Request/response validation
```

---

## Supabase Schema

Two core tables power the backend:

**`session_events`** — storefront telemetry
```sql
CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    page_url TEXT,
    cart_value NUMERIC DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_session_events_session_id ON session_events(session_id);
CREATE INDEX idx_session_events_timestamp ON session_events(timestamp DESC);
```

**`diagnoses`** — AI diagnosis results
```sql
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID,
    session_id TEXT,
    cache_key TEXT,
    root_cause TEXT NOT NULL,
    confidence NUMERIC NOT NULL,
    evidence JSONB,
    fix TEXT,
    impact_inr INTEGER,
    cached BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'webhook',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Example: Diagnose a Cart

```bash
curl -X POST https://YOUR_USERNAME-cartcoroner-api.hf.space/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "cart_value": 3499,
    "product_ids": ["prod_001"],
    "product_names": ["Linen Kurta Set"],
    "product_categories": ["ethnic-wear"],
    "customer_email": "user@example.com",
    "customer_order_count": 0,
    "abandonment_step": "shipping",
    "time_on_page_seconds": 145,
    "behavioral_signals": [
      "viewed shipping rates",
      "checked delivery timeline",
      "revisited cart page"
    ],
    "created_at": "2026-05-19T01:00:00Z"
  }'
```

**Response:**
```json
{
  "root_cause": "SHIPPING_SURPRISE",
  "confidence": 0.88,
  "evidence": [
    "Cart value ₹3499 is near common ₹3500 free-shipping thresholds",
    "Customer viewed shipping section and revisited cart — classic threshold friction",
    "Delivery timeline check indicates cost sensitivity, not product doubt"
  ],
  "fix": "Lower free-shipping threshold from ₹3500 to ₹3000 for ethnic-wear carts.",
  "impact_inr": 42000
}
```

---

## Links

- 🖥️ **Frontend Dashboard** — [CartCoroner on Vercel](https://cartcoroner.vercel.app)
- 📦 **GitHub Repository** — [SAMBHAV001-tech/cartcoroner-ai](https://github.com/SAMBHAV001-tech/cartcoroner-ai)
- 📊 **Interactive API Docs** — `https://YOUR_USERNAME-cartcoroner-api.hf.space/docs`

---

*Built for the hackathon — May 2026*
