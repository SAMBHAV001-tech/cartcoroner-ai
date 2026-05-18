# Behavioral Telemetry Explanation

## Why Traditional Analytics Fail
Most analytics platforms (like Google Analytics or native Shopify reporting) operate on **state changes**:
- Did the user reach the product page? (Yes/No)
- Did they reach the checkout page? (Yes/No)
- Did they purchase? (Yes/No)

This binary tracking tells you *what* happened, but it completely fails to explain *why*. If a user abandons a cart, traditional tools assume they just lost interest or that a 10% discount will bring them back. 

**CartCoroner is different.** We track the *friction between the states*. We use behavioral forensic intelligence to reconstruct the exact context of the abandonment.

---

## How the Tracker Works
CartCoroner uses a lightweight, vanilla JavaScript tracker injected directly into the Shopify `theme.liquid`. 

1. **Session Initialization**: On the first visit, the tracker assigns a persistent, anonymous `session_id` using `localStorage`.
2. **Event Listeners**: The script attaches non-blocking event listeners to critical DOM elements (variant selectors, cart buttons, checkout links).
3. **Asynchronous Dispatch**: As the user interacts, the tracker packages the event data and fires it asynchronously via `fetch` to our FastAPI backend, ensuring zero impact on storefront load times.
4. **Resilience**: Events are queued and batched to ensure delivery even if the user navigates away quickly.

---

## Captured Telemetry Events

Our intelligence engine relies on high-fidelity behavioral signals. We capture:

### 1. `variant_changed`
- **What it tracks**: Every time a user toggles a size, color, or style.
- **Why it matters**: Rapid toggling (e.g., changing variants 6 times in 10 seconds) is a strong indicator of **Decision Paralysis** or inventory confusion.

### 2. `checkout_step_reached`
- **What it tracks**: Progression through the checkout funnel (e.g., Information -> Shipping -> Payment).
- **Why it matters**: A sudden drop-off precisely when the shipping step loads is the clearest indicator of **Shipping Surprise** (unexpected costs or slow delivery times).

### 3. `page_revisit`
- **What it tracks**: The user navigating back to a product they've already viewed in the current session.
- **Why it matters**: Multiple revisits to the same expensive item indicate high intent but potential **Trust Gaps** or **Budget Resistance**.

### 4. `session_abandoned`
- **What it tracks**: The termination of the session (e.g., tab closed, prolonged inactivity) without a successful `purchase_completed` event.
- **Why it matters**: This acts as the trigger for our AI reasoning engine to perform the forensic autopsy on the preceding events.

---

## How AI Diagnosis Works

When a `session_abandoned` event is registered, CartCoroner does not send a generic email. Instead:
1. The FastAPI backend compiles the full chronological timeline of the user's telemetry events.
2. This timeline is fed into our **Groq-powered AI Reasoning Engine** (Llama 3).
3. The AI is prompted with strict forensic constraints to analyze the spacing, frequency, and sequence of the events.
4. It outputs a deterministic **Root Cause Category** (e.g., `SHIPPING_SURPRISE`, `VARIANT_CONFUSION`) along with a confidence score and human-readable reasoning.
5. Finally, it generates a personalized recovery message designed specifically to neutralize the identified friction.

*CartCoroner doesn't guess. We diagnose.*
