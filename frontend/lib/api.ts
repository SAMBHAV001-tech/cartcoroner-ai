import { Diagnosis, RootCause } from './mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://samd444-cartcoroner-backend.hf.space';

export const SCENARIO_PAYLOADS: Record<string, any> = {
  SHIPPING_SURPRISE: {
    cart_value: 3499,
    product_ids: ["sony-wh1000xm4"],
    product_names: ["Sony Wireless Headphones"],
    product_categories: ["Electronics"],
    customer_email: "karan.sharma.live@gmail.com",
    customer_order_count: 0,
    abandonment_step: "shipping",
    time_on_page_seconds: 124,
    behavioral_signals: [
      "hovered free shipping banner",
      "checked delivery timeline",
      "abandoned immediately after shipping cost added"
    ],
    created_at: new Date().toISOString()
  },
  PRICE_SHOCK: {
    cart_value: 85000,
    product_ids: ["macbook-air-m2"],
    product_names: ["MacBook Air M2"],
    product_categories: ["Electronics"],
    customer_email: "neha.kapoor.live@yahoo.com",
    customer_order_count: 2,
    abandonment_step: "payment",
    time_on_page_seconds: 450,
    behavioral_signals: [
      "checked EMI options",
      "changed payment method twice",
      "paused at payment gateway for 3 minutes"
    ],
    created_at: new Date().toISOString()
  },
  TRUST_GAP: {
    cart_value: 18500,
    product_ids: ["kanjivaram-silk"],
    product_names: ["Kanjivaram Silk Saree"],
    product_categories: ["Ethnic Wear"],
    customer_email: "priya.venkat.live@outlook.com",
    customer_order_count: 0,
    abandonment_step: "payment",
    time_on_page_seconds: 320,
    behavioral_signals: [
      "viewed return policy",
      "checked seller reviews",
      "hesitated at payment gateway"
    ],
    created_at: new Date().toISOString()
  },
  VARIANT_CONFUSION: {
    cart_value: 2199,
    product_ids: ["slim-fit-blazer"],
    product_names: ["Men's Slim Fit Blazer"],
    product_categories: ["Apparel"],
    customer_email: "rahul.desai.live@gmail.com",
    customer_order_count: 1,
    abandonment_step: "cart",
    time_on_page_seconds: 180,
    behavioral_signals: [
      "toggled size M and L repeatedly",
      "opened size guide",
      "switched colors twice"
    ],
    created_at: new Date().toISOString()
  }
};

export async function fetchDiagnoses(): Promise<Diagnosis[] | null> {
  try {
    const res = await fetch(`${API_URL}/diagnoses`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`API Warning: backend returned ${res.status} for /diagnoses. Falling back to mock data.`);
      return null;
    }
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.warn("Expected array from /diagnoses API");
      return null;
    }

    return data.map((d: any) => ({
      id: d.id,
      customerEmail: d.abandoned_carts?.customer_email || 'Guest',
      cartValue: d.abandoned_carts?.cart_value || 0,
      abandonmentStep: d.abandoned_carts?.abandonment_step || 'Unknown',
      rootCause: d.root_cause as RootCause,
      confidence: Math.round(d.confidence * 100) || 0,
      behavioralEvidence: Array.isArray(d.evidence) ? d.evidence : [],
      aiRecommendation: d.fix || 'Review checkout flow',
      weeklyRecoveryImpact: d.impact_inr || 0,
      sessionTimeline: [], // Not returned by backend yet
      productCategory: Array.isArray(d.abandoned_carts?.product_categories) && d.abandoned_carts.product_categories.length > 0 
        ? d.abandoned_carts.product_categories[0] 
        : 'General',
      timestamp: new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));
  } catch (error) {
    console.warn("Failed to fetch diagnoses. Falling back to mock data.", error);
    return null; // Return null so we can fallback to mock data
  }
}

export async function submitLiveDiagnosis(scenarioKey: string): Promise<Diagnosis | null> {
  const payload = SCENARIO_PAYLOADS[scenarioKey];
  if (!payload) {
    console.warn(`Unknown scenario: ${scenarioKey}`);
    return null;
  }

  try {
    // Update created_at so it looks fresh
    payload.created_at = new Date().toISOString();
    
    const res = await fetch(`${API_URL}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`API Warning: backend returned ${res.status} for /diagnose.`);
      throw new Error('Backend error');
    }

    const data = await res.json();

    // Generate a quick mock timeline based on behavioral signals
    const mockTimeline = payload.behavioral_signals.map((signal: string, index: number) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - (payload.behavioral_signals.length - index));
      return {
        action: signal.charAt(0).toUpperCase() + signal.slice(1),
        timestamp: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        highlight: index === payload.behavioral_signals.length - 1
      };
    });
    
    // Add initial step
    mockTimeline.unshift({
      action: `Viewed ${payload.product_names[0]}`,
      timestamp: new Date(Date.now() - 10 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      highlight: false
    });

    return {
      id: `live-${Date.now()}`,
      customerEmail: payload.customer_email,
      cartValue: payload.cart_value,
      abandonmentStep: payload.abandonment_step.charAt(0).toUpperCase() + payload.abandonment_step.slice(1),
      rootCause: data.root_cause as RootCause,
      confidence: Math.round(data.confidence * 100) || 85,
      behavioralEvidence: Array.isArray(data.evidence) && data.evidence.length > 0 ? data.evidence : payload.behavioral_signals,
      aiRecommendation: data.fix || 'Review checkout flow',
      weeklyRecoveryImpact: data.impact_inr || 0,
      sessionTimeline: mockTimeline,
      productCategory: payload.product_categories[0] || 'General',
      timestamp: 'Just now'
    };
  } catch (error) {
    console.warn("Failed to submit live diagnosis. Using fallback analysis.", error);
    // Return a graceful fallback if backend is down
    return {
      id: `fallback-${Date.now()}`,
      customerEmail: payload.customer_email,
      cartValue: payload.cart_value,
      abandonmentStep: payload.abandonment_step,
      rootCause: scenarioKey as RootCause,
      confidence: 60,
      behavioralEvidence: ["Backend offline - using fallback analysis", ...payload.behavioral_signals],
      aiRecommendation: "Please ensure the AI backend is running.",
      weeklyRecoveryImpact: payload.cart_value * 0.1,
      sessionTimeline: [],
      productCategory: payload.product_categories[0],
      timestamp: 'Just now'
    };
  }
}

export async function fetchLatestSessionId(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/session/latest`, { cache: 'no-store' });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.session_id || null;
  } catch (error) {
    console.warn("Failed to fetch latest session.", error);
    return null;
  }
}

export async function fetchSessionEvents(sessionId: string) {

  try {
    const res = await fetch(`${API_URL}/session/${sessionId}/events`, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`API Warning: backend returned ${res.status} for events.`);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.warn("Failed to fetch session events.", error);
    return [];
  }
}

export async function diagnoseRealSession(sessionId: string): Promise<Diagnosis | null> {
  try {
    const res = await fetch(`${API_URL}/session/${sessionId}/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`);
    }

    const data = await res.json();
    
    // We will build the timeline inside the component, so pass empty array here or build a basic one.
    // The component usually handles the live timeline display, but DiagnosisCard needs it.
    
    return {
      id: data.session_id,
      customerEmail: "Live Session User", // Or extract from events if available
      cartValue: data.impact_inr * 10, // Approximate if not provided
      abandonmentStep: "Active",
      rootCause: data.root_cause as RootCause,
      confidence: Math.round(data.confidence * 100) || 80,
      behavioralEvidence: Array.isArray(data.evidence) && data.evidence.length > 0 ? data.evidence : [],
      aiRecommendation: data.fix || 'Review checkout flow',
      weeklyRecoveryImpact: data.impact_inr || 0,
      sessionTimeline: [], // Component will merge real timeline
      productCategory: 'Live Data',
      timestamp: 'Just now'
    };
  } catch (error) {
    console.error("Failed to diagnose real session.", error);
    return null;
  }
}
