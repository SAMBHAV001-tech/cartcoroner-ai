# Product Document — CartCoroner AI

**Behavioral Revenue Intelligence for Shopify Merchants**

---

## 1. The Problem and Why It Matters

Cart abandonment costs global e-commerce ~$4 trillion annually. Shopify merchants typically respond with blast discount emails — 10% off, sent to everyone, regardless of why they actually left.

This fails because abandonment is a symptom, not a singular problem. A shopper who left because shipping was ₹299 on a ₹500 order has a different problem than one who toggled between size S and M eleven times before closing the tab. Sending a discount to someone who left due to trust concerns is noise, not intelligence, and actively erodes margin. 

Existing tools (Klaviyo, Omnisend, Shopify's native recovery) tell merchants *that* a cart was abandoned. They don't tell them *why* it happened at the behavioral level.

---

## 2. Target User & Current Experience

**Primary User:** Shopify merchants with 500–10,000 monthly sessions running active email or WhatsApp recovery campaigns. 
**Secondary User:** CRO (Conversion Rate Optimization) agencies managing multiple Shopify stores.

**Current Painful Experience:**
Right now, a merchant logs into Shopify or Google Analytics and sees a funnel report: "45% drop-off at shipping step." To figure out *why*, they have to:
1. Watch hours of unstructured Hotjar session recordings, hoping to stumble upon the exact sessions that abandoned.
2. Guess the cause (e.g., "Maybe our shipping is too high?") and implement a blind fix.
3. Send generic "Come back for 10% off!" emails, cheapening their brand to customers who might have bought at full price if their specific friction point was addressed.

---

## 3. What We Built & Core User Journey

We built a system that captures real-time behavioral micro-interactions (variant toggles, shipping dwell times, back-navigations) and uses Groq's LLaMA 3.3 70B to perform an AI forensic autopsy on the session when it abandons.

**The Core User Journey:**
1. **The Shopper:** Browses the store, toggles variants, checks shipping, and abandons.
2. **The Tracker:** Silently records this timeline and fires a final payload to our backend upon tab close.
3. **The AI:** Analyzes the behavioral timeline, diagnosing a root cause (e.g., `SHIPPING_SURPRISE` or `VARIANT_CONFUSION`).
4. **The Merchant:** Opens the CartCoroner dashboard, sees the live feed of diagnosed abandonments, reviews the exact session replay timeline, and implements the AI-recommended structural fix (or personalized recovery message).

---

## 4. Key Product Decisions & Reasoning

**Decision: Tracking micro-behaviors natively instead of relying on Shopify Webhooks.**
*Reasoning:* Webhooks only trigger on major state changes (cart updated, checkout started). They miss the nuances of hesitation—like a user switching back and forth between two sizes 5 times before leaving. True intent diagnosis requires micro-interaction data.

**Decision: Five specific root-cause categories.**
*Reasoning:* We constrained the AI to classify abandonments into five actionable buckets (`PRICE_SHOCK`, `SHIPPING_SURPRISE`, `TRUST_GAP`, `VARIANT_CONFUSION`, `JUST_BROWSING`) rather than generating free-text summaries. Merchants need quantifiable categories to prioritize structural fixes, not paragraphs of text.

**Decision: Using Groq LLaMA 3.3 70B.**
*Reasoning:* We needed a model capable of deep reasoning on temporal event data, but it had to be fast enough to populate a live dashboard. Groq provides near-instant inference, allowing the intelligence feed to update in real-time.

---

## 5. What We Chose NOT to Build (Scope Decisions)

- **NOT BUILT: Automated Email/WhatsApp Dispatch.** 
  *Why:* We scoped this out for v1 to focus purely on the intelligence and diagnosis engine. Automatically sending messages requires complex state management (opt-ins, throttling, ESP integrations) which distracts from the core forensic value proposition.
- **NOT BUILT: Screen Recording (Video).** 
  *Why:* Tools like Hotjar record pixels, which are heavy and hard to parse programmatically. We chose to capture *semantic events* (a timeline of actions) which is lightweight, privacy-friendly, and machine-readable for our LLM.
- **NOT BUILT: Full Analytics Suite.**
  *Why:* We are not replacing Google Analytics. We are a surgical tool for cart abandonment diagnostics only.

---

## 6. Tradeoffs Encountered & Resolution

**Tradeoff: Tracker performance vs. Data richness.**
Capturing every single mouse movement would provide the richest data for the AI but would bloat the payload and potentially slow down the Shopify storefront. 
*Resolution:* We compromised by tracking high-signal events only: variant changes, checkout step transitions, page revisits, and shipping-field hover dwells > 500ms.

**Tradeoff: Deterministic vs. AI execution.**
We wanted the AI to feel magical, but relying on it for everything is expensive and slow.
*Resolution:* We built a hybrid system. If a cart fits obvious deterministic heuristics (e.g., cart value < ₹500, time on site < 10s), we can classify it as `JUST_BROWSING` without an AI call. We reserve the heavy LLM inference for ambiguous, high-value sessions where nuanced behavioral reasoning is required.
