# Product Document — CartCoroner AI

**Behavioral Revenue Intelligence for Shopify Merchants**

---

## Executive Summary

CartCoroner is an AI-powered behavioral forensic platform that diagnoses why shoppers abandon carts on Shopify storefronts. It captures real storefront micro-interactions, stores them as timestamped behavioral telemetry, and uses Groq's LLaMA 3.3 70B to perform session autopsies — delivering root-cause diagnoses and targeted recovery recommendations to merchants.

The core insight: **abandonment is a symptom. The friction that caused it is the problem.** CartCoroner surfaces the friction.

---

## Problem Statement

Cart abandonment costs global e-commerce ~$4 trillion annually. Shopify merchants typically respond with blast discount emails — 10% off, sent to everyone, regardless of why they actually left.

This fails because abandonment is not a single problem. A shopper who left because shipping was ₹299 on a ₹500 order has a different problem than one who toggled between size S and M eleven times before closing the tab. Existing tools (Klaviyo, Omnisend, Shopify's native recovery) tell you *that* a cart was abandoned. They don't tell you *why* it happened at the behavioral level.

---

## Why Cart Abandonment Matters

- **Average abandonment rate:** 70%+ across e-commerce globally
- **Recoverable revenue:** 5–15% of abandoned carts are recoverable with the right intervention
- **The intervention problem:** The wrong message to the wrong shopper actively reduces recovery rates — a discount sent to someone who left due to trust concerns is noise, not intelligence
- **Merchant gap:** Most Shopify merchants under $1M GMR have no behavioral analytics beyond basic funnel reports

---

## Target Users

**Primary:** Shopify merchants with 500–10,000 monthly sessions running active email or WhatsApp recovery campaigns who want to stop guessing why carts are being abandoned.

**Secondary:** CRO agencies managing multiple Shopify stores who need session-level behavioral evidence to justify optimization recommendations.

---

## Core Features

### 1. Real-Time Behavioral Telemetry

A lightweight JavaScript snippet injected into Shopify's `theme.liquid` captures five categories of behavioral events from real shopper sessions:

| Event | What It Signals |
|-------|----------------|
| `variant_changed` | Decision paralysis — can't commit to size or color |
| `checkout_step_reached` | Exact funnel position at abandonment |
| `shipping_section_viewed` | Delivery cost concern — dwell time on shipping fields |
| `page_revisit` | Hesitation — the shopper left and came back |
| `session_abandoned` | Tab close or inactivity, with last-known context |

Events fire asynchronously with `keepalive: true` — ensuring the abandonment event reaches the backend even as the browser terminates the page.

### 2. AI Forensic Diagnosis

The behavioral event timeline is submitted to Groq's LLaMA 3.3 70B with a forensic prompt. The AI returns:

- **Root cause classification** — one of five evidence-based categories
- **Confidence score** — 0.55 to 0.95
- **Evidence observations** — 3 specific behavioral facts from the session
- **Recovery fix** — one actionable merchant recommendation
- **Revenue impact estimate** — projected recovery value in INR

### 3. Root Cause Classification

| Code | Merchant Label | Trigger Pattern |
|------|---------------|----------------|
| `PRICE_SHOCK` | Budget Resistance | High cart value, payment-step drop-off |
| `SHIPPING_SURPRISE` | Delivery Friction | Abandonment at shipping, delivery field interaction |
| `TRUST_GAP` | Confidence Breakdown | Review/return-policy interactions before exit |
| `VARIANT_CONFUSION` | Decision Paralysis | 3+ variant toggle events before abandonment |
| `JUST_BROWSING` | Low Purchase Intent | Short session, low value, early exit |

### 4. Live Session Replay

The dashboard renders a chronological timeline of every behavioral event in the most recent session. Merchants see the exact sequence: product view → variant toggle → cart add → shipping view → abandonment. No screen recording tool required for intent diagnosis.

### 5. Behavioral Revenue Analytics

Dashboard aggregates diagnoses into root cause distribution, abandonment trends over time, and weekly revenue recovery opportunity by category.

---

## Business Impact

For a merchant with ₹50L/month in cart abandonment, identifying that 40% of abandonment is `SHIPPING_SURPRISE` shifts the intervention from blanket discounts to testing a free shipping threshold — a structural fix with lasting ROI.

**The precision difference:**
- Generic recovery blast → 3–5% recovery rate
- Root-cause targeted recovery → documented 2–3× improvement in industry studies

---

## Future Scope

- **Predictive Abandonment Scoring** — Score sessions in real-time and trigger on-page interventions before the shopper leaves
- **Automated Recovery Dispatch** — Direct integration with Klaviyo and WhatsApp Business for autonomous root-cause-matched messaging
- **A/B Test Generation** — AI-generated recovery copy variants routed into Klaviyo A/B campaigns, with outcome tracking back into CartCoroner
- **Multi-Store Aggregation** — Aggregate behavioral patterns across a Shopify store portfolio for agency use
- **Spatial Heatmap Overlay** — Combine click/scroll spatial data with session event timelines for full-context friction identification
