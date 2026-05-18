# CartCoroner Demo Script

**Tone**: Hackathon-demo ready. Short, powerful, and focused on behavioral intelligence.

---

## 1. The Setup (0:00 - 0:15)
*(Screen shows Shopify Storefront)*

**Speaker:** 
"Most analytics tools explain *what* happened—like 'the user left at checkout'. But they don't tell you *why*. CartCoroner captures real storefront behavioral telemetry and transforms it into actionable abandonment intelligence. Let me show you."

## 2. Triggering Telemetry (0:15 - 0:45)
*(Speaker browses the Shopify store naturally)*

**Action**: Click on a product.
**Speaker:** "I'm a customer looking at this premium jacket."

**Action**: Rapidly toggle between 4-5 different color/size variants.
**Speaker:** "Watch this behavior. I'm toggling variants constantly. In a normal store, this is lost. With our injected JS tracker, this is captured as decision paralysis."

**Action**: Proceed to checkout, hesitate on the shipping page for a few seconds, then close the tab.
**Speaker:** "I reach checkout, see the shipping cost, and abandon the session. Let's look at the telemetry."

## 3. Real-Time Data Flow (0:45 - 1:00)
*(Switch tab to Supabase Database View)*

**Action**: Show the `session_events` table live-updating.
**Speaker:** "Our tracker captures exact telemetry: `variant_changed`, `checkout_step_reached`, `page_revisit`, and `session_abandoned`. No guessing. Pure behavioral data hitting our FastAPI backend in real-time."

## 4. Behavioral Intelligence Dashboard (1:00 - 1:30)
*(Switch tab to CartCoroner Next.js Dashboard)*

**Action**: Open the Live Session Monitor. Select the abandoned session just created.
**Speaker:** "This is the CartCoroner dashboard. We don't just see a lost cart; we see the entire behavioral timeline."

**Action**: Click 'Run Forensic Diagnosis'.
**Speaker:** "Now, our Groq-powered AI reasoning engine performs an autopsy on this session's telemetry."

## 5. The Reveal (1:30 - 2:00)
*(UI shows the Diagnosis Results: "Category: Decision Paralysis -> Shipping Surprise")*

**Action**: Highlight the AI Reasoning text.
**Speaker:** "Look at the intelligence. The AI identified intense variant toggling followed by an immediate exit at the shipping step. The root cause wasn't price; it was shipping hesitation combined with decision fatigue."

**Action**: Highlight the Recovery Recommendation.
**Speaker:** "Instead of sending a generic 10% discount, CartCoroner generates a highly targeted recovery strategy: *'Still deciding on the color? Complete your order today and we'll upgrade you to free express shipping.'*"

## 6. Closing (2:00 - 2:15)
*(Return to Dashboard Overview)*

**Speaker:** "Most AI shopping tools are reactive. CartCoroner is behavioral forensic intelligence. Stop guessing why your carts are abandoned, and start diagnosing the friction."
