import os
import hmac
import hashlib
import json
import base64
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Literal
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SHOPIFY_WEBHOOK_SECRET = os.getenv("SHOPIFY_WEBHOOK_SECRET", "")

app = FastAPI(title="CartCoroner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Supabase REST client — works with ANY key format (sb_publishable_, JWT, etc.)
# ---------------------------------------------------------------------------
class SupabaseHTTP:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, columns: str = "*", eq: dict = None,
               gte: dict = None, order_by: str = None, order_desc: bool = False,
               limit: int = None) -> list:
        params: dict = {"select": columns}
        if eq:
            for k, v in eq.items():
                params[k] = f"eq.{v}"
        if gte:
            for k, v in gte.items():
                params[k] = f"gte.{v}"
        if order_by:
            params["order"] = f"{order_by}.{'desc' if order_desc else 'asc'}"
        if limit:
            params["limit"] = limit
        try:
            r = httpx.get(f"{self.url}/rest/v1/{table}", headers=self.headers, params=params, timeout=10)
            return r.json() if r.status_code == 200 else []
        except Exception as e:
            print(f"[DB select error] {e}")
            return []

    def insert(self, table: str, data: dict) -> list:
        try:
            r = httpx.post(f"{self.url}/rest/v1/{table}", headers=self.headers, json=data, timeout=10)
            return r.json() if r.status_code in (200, 201) else []
        except Exception as e:
            print(f"[DB insert error] {e}")
            return []

    def rpc(self, func_name: str, params: dict = None) -> any:
        try:
            r = httpx.post(f"{self.url}/rest/v1/rpc/{func_name}", headers=self.headers,
                           json=params or {}, timeout=10)
            return r.json() if r.status_code == 200 else {}
        except Exception as e:
            print(f"[DB rpc error] {e}")
            return {}

# --- Init DB ---
db: SupabaseHTTP = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        db = SupabaseHTTP(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Supabase REST client ready")
    except Exception as e:
        print(f"⚠ Supabase init failed: {e}")

# --- Init Groq ---
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY)
        print("✓ Groq client ready")
    except Exception as e:
        print(f"⚠ Groq init failed: {e}")

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class CartData(BaseModel):
    cart_value: float
    product_ids: List[str]
    product_names: List[str] = []
    product_categories: List[str]
    customer_email: Optional[str] = None
    customer_order_count: int = 0
    abandonment_step: str
    time_on_page_seconds: int = 0
    behavioral_signals: List[str] = []
    created_at: str

class DiagnosisResponse(BaseModel):
    root_cause: str
    confidence: float
    evidence: List[str]
    fix: str
    impact_inr: int

class RecoveryResponse(BaseModel):
    message: str
    channel_suggestion: str

EventType = Literal["variant_changed", "checkout_step_reached", "page_revisit", "session_abandoned", "shipping_section_viewed"]

class SessionEventCreate(BaseModel):
    session_id: str
    event_type: EventType
    metadata: Optional[Dict[str, Any]] = None
    page_url: Optional[str] = None
    cart_value: float = 0.0
    timestamp: str

class DiagnosisRealResponse(BaseModel):
    session_id: str
    root_cause: str
    merchant_label: str
    confidence: float
    evidence: List[str]
    fix: str
    impact_inr: int
    events_analyzed: int

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def verify_shopify_webhook(data: bytes, hmac_header: str) -> bool:
    if not SHOPIFY_WEBHOOK_SECRET or not hmac_header:
        return False
    digest = hmac.new(SHOPIFY_WEBHOOK_SECRET.encode("utf-8"), data, digestmod=hashlib.sha256).digest()
    return hmac.compare_digest(base64.b64encode(digest).decode("utf-8"), hmac_header)

def get_cart_value_bucket(value: float) -> str:
    if value <= 1000: return "0-1000"
    elif value <= 3000: return "1000-3000"
    elif value <= 5000: return "3000-5000"
    return "5000+"

def compute_cache_key(cart_data: dict) -> str:
    bucket = get_cart_value_bucket(cart_data.get("cart_value", 0))
    categories = sorted(cart_data.get("product_categories", []))
    step = cart_data.get("abandonment_step", "")
    return hashlib.sha256(f"{bucket}*{categories}*{step}".encode()).hexdigest()

def fallback_diagnosis(cart_data: dict) -> DiagnosisResponse:
    step = cart_data.get("abandonment_step", "").lower()
    value = cart_data.get("cart_value", 0)
    if step == "shipping":
        root_cause = "SHIPPING_SURPRISE"
    elif value > 3000 and step == "payment":
        root_cause = "PRICE_SHOCK"
    else:
        root_cause = "JUST_BROWSING"
    return DiagnosisResponse(
        root_cause=root_cause, confidence=0.6,
        evidence=["Fallback activated due to API error or latency."],
        fix="Review checkout flow for general improvements.",
        impact_inr=int(value * 0.1)
    )

async def perform_diagnosis_task(cart_data: dict, cart_id: str):
    try:
        diagnosis = get_diagnosis_logic(cart_data)
        if db:
            cache_key = compute_cache_key(cart_data)
            db.insert("diagnoses", {
                "cart_id": cart_id, "cache_key": cache_key,
                "root_cause": diagnosis.root_cause, "confidence": diagnosis.confidence,
                "evidence": diagnosis.evidence, "fix": diagnosis.fix,
                "impact_inr": diagnosis.impact_inr, "cached": False
            })
    except Exception as e:
        print(f"Background diagnosis error: {e}")

SYSTEM_PROMPT = """You are CartCoroner AI, a behavioral revenue intelligence engine for Shopify merchants.
Diagnose abandoned carts and classify into ONE root cause:
1. PRICE_SHOCK - high cart value, payment-step drop-off, budget hesitation
2. SHIPPING_SURPRISE - abandonment at shipping step, unexpected delivery costs
3. TRUST_GAP - high value purchase, hesitation about safety/trust
4. VARIANT_CONFUSION - fashion products, repeated size/variant toggling
5. JUST_BROWSING - low value, short session, weak purchase intent

Return ONLY valid JSON:
{"root_cause": "...", "confidence": float, "evidence": [string, string, string], "fix": string, "impact_inr": integer}

Rules: confidence 0.55-0.95, evidence must be specific behavioral observations, fix must be ONE actionable recommendation, never output markdown."""

def get_diagnosis_logic(cart_data: dict) -> DiagnosisResponse:
    cache_key = compute_cache_key(cart_data)

    # Check cache
    if db:
        try:
            one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            rows = db.select("diagnoses", eq={"cache_key": cache_key},
                             gte={"created_at": one_day_ago},
                             order_by="created_at", order_desc=True, limit=1)
            if rows:
                c = rows[0]
                return DiagnosisResponse(root_cause=c["root_cause"], confidence=c["confidence"],
                                         evidence=c["evidence"], fix=c["fix"], impact_inr=c["impact_inr"])
        except Exception as e:
            print(f"Cache check error: {e}")

    if not groq_client:
        return fallback_diagnosis(cart_data)

    signals_str = "\n".join([f"- {s}" for s in cart_data.get("behavioral_signals", [])])
    user_prompt = f"""Cart value: ₹{cart_data.get('cart_value', 0)}
Products: {', '.join(cart_data.get('product_names', cart_data.get('product_ids', [])))}
Categories: {', '.join(cart_data.get('product_categories', []))}
Customer previous orders: {cart_data.get('customer_order_count', 0)}
Abandonment step: {cart_data.get('abandonment_step', 'unknown')}
Time on page: {cart_data.get('time_on_page_seconds', 'Unknown')} seconds
Behavioral signals:
{signals_str}"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": SYSTEM_PROMPT},
                      {"role": "user", "content": user_prompt}],
            max_tokens=400, temperature=0.1, response_format={"type": "json_object"}
        )
        r = json.loads(completion.choices[0].message.content)
        return DiagnosisResponse(
            root_cause=r.get("root_cause", "JUST_BROWSING"),
            confidence=float(r.get("confidence", 0.6)),
            evidence=r.get("evidence", []),
            fix=r.get("fix", "Review checkout."),
            impact_inr=int(r.get("impact_inr", 0))
        )
    except Exception as e:
        print(f"Groq error: {e}")
        return fallback_diagnosis(cart_data)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "supabase": "connected" if db else "unavailable",
            "groq": "connected" if groq_client else "unavailable",
        }
    }

@app.post("/webhook/shopify")
async def shopify_webhook(request: Request, background_tasks: BackgroundTasks,
                          x_shopify_hmac_sha256: Optional[str] = Header(None)):
    raw_body = await request.body()
    if not verify_shopify_webhook(raw_body, x_shopify_hmac_sha256):
        raise HTTPException(status_code=401, detail="Invalid Webhook Signature")
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON Payload")

    cart_value = float(payload.get("total_price", 0))
    line_items = payload.get("line_items", [])
    product_ids = [str(item.get("product_id")) for item in line_items if item.get("product_id")]
    customer = payload.get("customer", {})
    customer_email = payload.get("email") or customer.get("email")

    abandonment_step = "cart"
    if payload.get("shipping_address"): abandonment_step = "shipping"
    if payload.get("billing_address"): abandonment_step = "payment"

    created_at = payload.get("created_at", datetime.now(timezone.utc).isoformat())
    cart_data = {
        "cart_value": cart_value, "product_ids": product_ids, "product_names": [],
        "product_categories": [], "customer_email": customer_email,
        "customer_order_count": 0, "abandonment_step": abandonment_step,
        "time_on_page_seconds": 0, "behavioral_signals": [], "created_at": created_at
    }

    cart_id = "00000000-0000-0000-0000-000000000000"
    if db:
        try:
            result = db.insert("abandoned_carts", {
                "cart_value": cart_value, "product_categories": [],
                "customer_email": customer_email, "abandonment_step": abandonment_step,
                "created_at": created_at
            })
            if result:
                cart_id = result[0]["id"]
        except Exception as e:
            print(f"Error saving cart: {e}")

    background_tasks.add_task(perform_diagnosis_task, cart_data, cart_id)
    return {"status": "accepted"}

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(cart: CartData):
    cart_dict = cart.model_dump()
    diagnosis = get_diagnosis_logic(cart_dict)
    if db:
        try:
            db.insert("diagnoses", {
                "cache_key": compute_cache_key(cart_dict),
                "root_cause": diagnosis.root_cause, "confidence": diagnosis.confidence,
                "evidence": diagnosis.evidence, "fix": diagnosis.fix,
                "impact_inr": diagnosis.impact_inr, "cached": False
            })
        except Exception as e:
            print(f"Error saving diagnosis: {e}")
    return diagnosis

@app.post("/recovery", response_model=RecoveryResponse)
async def generate_recovery(diagnosis: dict):
    if not groq_client:
        return RecoveryResponse(
            message="Hey, we noticed you left some items in your cart. Come back and complete your purchase!",
            channel_suggestion="email"
        )
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a CRO expert. Given a cart abandonment diagnosis, write a personalized recovery message and suggest the best channel (email/sms/whatsapp). Return ONLY JSON: {\"message\": string, \"channel_suggestion\": string}"},
                {"role": "user", "content": json.dumps(diagnosis)}
            ],
            max_tokens=250, temperature=0.7, response_format={"type": "json_object"}
        )
        r = json.loads(completion.choices[0].message.content)
        return RecoveryResponse(message=r.get("message", "We noticed you left something behind!"),
                                channel_suggestion=r.get("channel_suggestion", "email"))
    except Exception as e:
        print(f"Recovery error: {e}")
        return RecoveryResponse(
            message="Hey, we noticed you left some items in your cart. Come back and complete your purchase!",
            channel_suggestion="email"
        )

@app.get("/diagnoses")
async def get_diagnoses():
    if not db: return []
    try:
        return db.select("diagnoses", columns="*,abandoned_carts(*)",
                         order_by="created_at", order_desc=True, limit=50)
    except Exception as e:
        print(f"Error fetching diagnoses: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patterns")
async def get_patterns():
    if not db: return {}
    try:
        return db.rpc("get_patterns")
    except Exception as e:
        print(f"Error fetching patterns: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/session/latest")
async def get_latest_session():
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        rows = db.select("session_events", columns="session_id",
                         order_by="timestamp", order_desc=True, limit=1)
        return {"session_id": rows[0]["session_id"] if rows else None}
    except Exception as e:
        print(f"Error fetching latest session: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch latest session")

@app.post("/session/event")
async def receive_session_event(event: SessionEventCreate):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        db.insert("session_events", {
            "session_id": event.session_id, "event_type": event.event_type,
            "metadata": event.metadata, "page_url": event.page_url,
            "cart_value": event.cart_value, "timestamp": event.timestamp
        })
        return {"received": True}
    except Exception as e:
        print(f"Error saving session event: {e}")
        raise HTTPException(status_code=500, detail="Failed to save event")

@app.get("/session/{session_id}/events")
async def get_session_events(session_id: str):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        return db.select("session_events", eq={"session_id": session_id},
                         order_by="timestamp", order_desc=False)
    except Exception as e:
        print(f"Error fetching session events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

@app.post("/session/{session_id}/diagnose", response_model=DiagnosisRealResponse)
async def diagnose_session(session_id: str):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")

    events = db.select("session_events", eq={"session_id": session_id},
                       order_by="timestamp", order_desc=False)
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this session")

    variant_changed_count = sum(1 for e in events if e["event_type"] == "variant_changed")
    page_revisit_count = sum(1 for e in events if e["event_type"] == "page_revisit")
    has_shipping_viewed = any(e["event_type"] == "shipping_section_viewed" for e in events)
    last_event = events[-1]
    last_active_step = last_event["event_type"]
    if last_event["event_type"] == "checkout_step_reached" and last_event.get("metadata"):
        last_active_step = last_event["metadata"].get("step", last_active_step)

    is_abandoned = any(e["event_type"] == "session_abandoned" for e in events)
    abandoned_at_payment = is_abandoned and last_active_step == "payment"
    abandoned_at_shipping = is_abandoned and (last_active_step == "shipping" or has_shipping_viewed)

    try:
        start_time = datetime.fromisoformat(events[0]["timestamp"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(events[-1]["timestamp"].replace("Z", "+00:00"))
        total_duration_seconds = int((end_time - start_time).total_seconds())
    except Exception:
        total_duration_seconds = 0

    max_cart_value = max((float(e.get("cart_value") or 0) for e in events), default=0)

    MERCHANT_LABELS = {
        "PRICE_SHOCK": "Budget Resistance", "SHIPPING_SURPRISE": "Delivery Friction",
        "TRUST_GAP": "Confidence Breakdown", "VARIANT_CONFUSION": "Decision Paralysis",
        "JUST_BROWSING": "Low Purchase Intent"
    }

    fallback_cause = "JUST_BROWSING"
    if variant_changed_count > 2: fallback_cause = "VARIANT_CONFUSION"
    elif abandoned_at_payment: fallback_cause = "PRICE_SHOCK"
    elif abandoned_at_shipping or has_shipping_viewed: fallback_cause = "SHIPPING_SURPRISE"
    elif page_revisit_count > 1: fallback_cause = "PRICE_SHOCK"

    root_cause, confidence, evidence, fix, impact_inr = fallback_cause, 0.6, [], "Review checkout flow.", int(max_cart_value * 0.1)

    if groq_client:
        context = (f"Total events: {len(events)}, Duration: {total_duration_seconds}s, "
                   f"Max cart: ₹{max_cart_value}, Last step: {last_active_step}, "
                   f"Variants changed: {variant_changed_count}, Page revisits: {page_revisit_count}, "
                   f"Shipping viewed: {has_shipping_viewed}")
        events_summary = "\n".join([f"- {e['event_type']} at {e['timestamp']}" for e in events])
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are CartCoroner AI. Analyze real ecommerce behavioral telemetry and diagnose the abandonment friction. Return ONLY JSON: {\"root_cause\": \"PRICE_SHOCK|SHIPPING_SURPRISE|TRUST_GAP|VARIANT_CONFUSION|JUST_BROWSING\", \"confidence\": float, \"evidence\": [string], \"fix\": string, \"impact_inr\": integer}"},
                    {"role": "user", "content": f"Context:\n{context}\n\nEvents:\n{events_summary}"}
                ],
                max_tokens=400, temperature=0.1, response_format={"type": "json_object"}
            )
            r = json.loads(completion.choices[0].message.content)
            root_cause = r.get("root_cause", fallback_cause)
            if root_cause not in MERCHANT_LABELS: root_cause = fallback_cause
            confidence = float(r.get("confidence", 0.7))
            evidence = r.get("evidence", [])
            fix = r.get("fix", "Review checkout flow.")
            impact_inr = int(r.get("impact_inr", 0))
        except Exception as e:
            print(f"Groq session diagnosis error: {e}")

    try:
        db.insert("diagnoses", {
            "session_id": session_id, "cache_key": f"session_{session_id}",
            "root_cause": root_cause, "confidence": confidence,
            "evidence": evidence, "fix": fix, "impact_inr": impact_inr,
            "cached": False, "source": "real_session"
        })
    except Exception as e:
        print(f"Error saving session diagnosis: {e}")

    return DiagnosisRealResponse(
        session_id=session_id, root_cause=root_cause,
        merchant_label=MERCHANT_LABELS.get(root_cause, "Low Purchase Intent"),
        confidence=confidence, evidence=evidence, fix=fix,
        impact_inr=impact_inr, events_analyzed=len(events)
    )
