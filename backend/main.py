import os
import hmac
import hashlib
import json
import base64
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# Load environment variables
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SHOPIFY_WEBHOOK_SECRET = os.getenv("SHOPIFY_WEBHOOK_SECRET", "")

# Initialize FastAPI
app = FastAPI(title="CartCoroner API")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Groq
groq_client = None
if GROQ_API_KEY:
    groq_client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=GROQ_API_KEY
    )

# --- Pydantic Models ---

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

# --- Helper Functions ---

def verify_shopify_webhook(data: bytes, hmac_header: str) -> bool:
    if not SHOPIFY_WEBHOOK_SECRET or not hmac_header:
        return False
    digest = hmac.new(
        SHOPIFY_WEBHOOK_SECRET.encode('utf-8'),
        data,
        digestmod=hashlib.sha256
    ).digest()
    computed_hmac = base64.b64encode(digest).decode('utf-8')
    return hmac.compare_digest(computed_hmac, hmac_header)

def get_cart_value_bucket(value: float) -> str:
    if value <= 1000:
        return "0-1000"
    elif value <= 3000:
        return "1000-3000"
    elif value <= 5000:
        return "3000-5000"
    return "5000+"

def compute_cache_key(cart_data: dict) -> str:
    bucket = get_cart_value_bucket(cart_data.get("cart_value", 0))
    categories = sorted(cart_data.get("product_categories", []))
    step = cart_data.get("abandonment_step", "")
    key_string = f"{bucket}*{categories}*{step}"
    return hashlib.sha256(key_string.encode('utf-8')).hexdigest()

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
        root_cause=root_cause,
        confidence=0.6,
        evidence=["Fallback activated due to API error or latency."],
        fix="Review checkout flow for general improvements.",
        impact_inr=int(value * 0.1) # Arbitrary low estimate
    )

async def perform_diagnosis_task(cart_data: dict, cart_id: str):
    # This task is designed to be called asynchronously after webhook
    try:
        diagnosis = get_diagnosis_logic(cart_data)
        # Save diagnosis back to supabase mapping to cart_id
        if supabase:
            cache_key = compute_cache_key(cart_data)
            supabase.table("diagnoses").insert({
                "cart_id": cart_id,
                "cache_key": cache_key,
                "root_cause": diagnosis.root_cause,
                "confidence": diagnosis.confidence,
                "evidence": diagnosis.evidence,
                "fix": diagnosis.fix,
                "impact_inr": diagnosis.impact_inr,
                "cached": False # Since we actually ran it
            }).execute()
    except Exception as e:
        print(f"Error in background diagnosis task: {e}")

def get_diagnosis_logic(cart_data: dict) -> DiagnosisResponse:
    cache_key = compute_cache_key(cart_data)
    
    # 1. Check Cache in Supabase
    if supabase:
        try:
            one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            response = supabase.table("diagnoses") \
                .select("*") \
                .eq("cache_key", cache_key) \
                .gte("created_at", one_day_ago) \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
                
            if response.data and len(response.data) > 0:
                cached_data = response.data[0]
                return DiagnosisResponse(
                    root_cause=cached_data["root_cause"],
                    confidence=cached_data["confidence"],
                    evidence=cached_data["evidence"],
                    fix=cached_data["fix"],
                    impact_inr=cached_data["impact_inr"]
                )
        except Exception as e:
            print(f"Supabase cache error: {e}")

    # 2. Call Groq
    if not groq_client:
        return fallback_diagnosis(cart_data)

    system_prompt = """
You are CartCoroner AI, a behavioral revenue intelligence engine for Shopify merchants.

Your job is to perform behavioral autopsies on abandoned ecommerce carts and identify the MOST likely root cause of checkout abandonment.

You are NOT a chatbot.
You are an expert ecommerce behavioral analyst.

Your analysis must feel:
- specific
- evidence-based
- psychologically believable
- merchant actionable

You must classify every cart into ONE root cause category:

1. PRICE_SHOCK
Use when:
- cart value is high
- abandonment occurs at payment
- customer spent long time on checkout
- behavior suggests budget hesitation or sticker shock
- signals: payment hesitation, pricing revisits, EMI/payment switching

2. SHIPPING_SURPRISE
Use when:
- abandonment occurs at shipping step
- cart value is near a psychologically important threshold
- shipping costs likely appeared unexpectedly
- signals: shipping-step abandonment, free-shipping threshold behavior, delivery timeline checking

3. TRUST_GAP
Use when:
- purchase value is high
- customer appears hesitant about trust/safety
- signals include viewing reviews, seller checks, return-policy interactions, long hesitation before payment

4. VARIANT_CONFUSION
Use when:
- clothing/fashion products involved
- multiple variant or size interactions
- customer appears uncertain about fit or selection
- signals: size toggles, repeated variant switching, size guide interactions

5. JUST_BROWSING
Use when:
- low cart value
- very short session
- weak purchase intent
- no clear friction pattern
- signals: short sessions, weak engagement, no friction signals

Return ONLY valid JSON.

Schema:
{
  "root_cause": "PRICE_SHOCK | SHIPPING_SURPRISE | TRUST_GAP | VARIANT_CONFUSION | JUST_BROWSING",
  "confidence": float,
  "evidence": [string, string, string],
  "fix": string,
  "impact_inr": integer
}

Rules:
- confidence must be between 0.55 and 0.95
- evidence must reference specific behavioral observations
- avoid generic explanations
- fix must be ONE specific merchant recommendation
- impact_inr should be realistic weekly recoverable revenue
- never output markdown
- never explain reasoning outside JSON

Good evidence example:
"Cart value ₹3200 is unusually close to common ₹3500 free-shipping thresholds."

Examples of behavioral signals:
- "hovered free shipping banner"
- "viewed return policy"
- "changed payment method twice"
- "toggled size M and L repeatedly"
- "revisited pricing section"
- "checked delivery timeline"

Bad evidence example:
"Customer abandoned cart."

Good fix example:
"Lower free-shipping threshold from ₹3500 to ₹3000 for electronics carts."

Bad fix example:
"Improve user experience."
"""
    signals_str = chr(10).join([f"- {s}" for s in cart_data.get('behavioral_signals', [])])
    
    user_prompt = f"""Cart value: ₹{cart_data.get('cart_value', 0)}

Products:
{', '.join(cart_data.get('product_names', cart_data.get('product_ids', []))) if cart_data.get('product_names') or cart_data.get('product_ids') else 'None'}

Categories:
{', '.join(cart_data.get('product_categories', [])) if cart_data.get('product_categories') else 'None'}

Customer previous orders:
{cart_data.get('customer_order_count', 0)}

Abandonment step:
{cart_data.get('abandonment_step', 'unknown')}

Time on page:
{cart_data.get('time_on_page_seconds', 'Unknown')} seconds

Behavioral signals observed:
{signals_str}
- Cart value is ₹{cart_data.get('cart_value', 0)}
- Abandoned during {cart_data.get('abandonment_step', 'unknown')} phase
- {"Guest user" if not cart_data.get('customer_email') else "Registered customer"}
"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=400,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        result_text = completion.choices[0].message.content
        result_json = json.loads(result_text)
        
        return DiagnosisResponse(
            root_cause=result_json.get("root_cause", "JUST_BROWSING"),
            confidence=float(result_json.get("confidence", 0.6)),
            evidence=result_json.get("evidence", []),
            fix=result_json.get("fix", "Review checkout."),
            impact_inr=int(result_json.get("impact_inr", 0))
        )
    except Exception as e:
        print(f"Groq API error: {e}")
        return fallback_diagnosis(cart_data)


# --- Endpoints ---

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/webhook/shopify")
async def shopify_webhook(
    request: Request, 
    background_tasks: BackgroundTasks,
    x_shopify_hmac_sha256: Optional[str] = Header(None)
):
    raw_body = await request.body()
    
    # 1. Validate HMAC
    if not verify_shopify_webhook(raw_body, x_shopify_hmac_sha256):
        raise HTTPException(status_code=401, detail="Invalid Webhook Signature")
        
    try:
        payload = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON Payload")

    # 2. Extract Data (Assuming standard Shopify Checkout/Cart structure, adapting as best effort)
    # The actual structure depends on the specific webhook topic, but we'll try to extract what we can.
    cart_value = float(payload.get("total_price", 0))
    
    line_items = payload.get("line_items", [])
    product_ids = [str(item.get("product_id")) for item in line_items if item.get("product_id")]
    # categories might not be directly in line_items depending on shopify setup, but we'll try
    product_categories = []
    
    customer = payload.get("customer", {})
    customer_email = payload.get("email") or customer.get("email")
    
    # Estimate abandonment step from payload data (simplified logic)
    abandonment_step = "cart"
    if payload.get("shipping_address"):
        abandonment_step = "shipping"
    if payload.get("billing_address"):
        abandonment_step = "payment"
        
    created_at = payload.get("created_at", datetime.now(timezone.utc).isoformat())

    cart_data = {
        "cart_value": cart_value,
        "product_ids": product_ids,
        "product_names": [], # Future placeholder for richer webhooks
        "product_categories": product_categories,
        "customer_email": customer_email,
        "customer_order_count": 0,
        "abandonment_step": abandonment_step,
        "time_on_page_seconds": 0,
        "behavioral_signals": [],
        "created_at": created_at
    }

    cart_id = None
    # 3. Save to Supabase
    if supabase:
        try:
            db_res = supabase.table("abandoned_carts").insert({
                "cart_value": cart_value,
                "product_categories": product_categories,
                "customer_email": customer_email,
                "abandonment_step": abandonment_step,
                "created_at": created_at
            }).execute()
            if db_res.data and len(db_res.data) > 0:
                cart_id = db_res.data[0]["id"]
        except Exception as e:
            print(f"Error saving to supabase: {e}")

    # 4. Trigger diagnosis async
    if cart_id:
        background_tasks.add_task(perform_diagnosis_task, cart_data, cart_id)
    else:
        # If we couldn't save the cart, we can still run diagnosis and try to save it standalone if needed,
        # but the schema requires cart_id. We'll skip saving to DB in background task if no cart_id.
        background_tasks.add_task(perform_diagnosis_task, cart_data, "00000000-0000-0000-0000-000000000000") # placeholder

    return {"status": "accepted"}

@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(cart: CartData):
    cart_dict = cart.model_dump()
    diagnosis = get_diagnosis_logic(cart_dict)
    
    # Save the direct diagnosis request to DB as well (without a webhook cart mapping)
    if supabase:
        try:
            cache_key = compute_cache_key(cart_dict)
            supabase.table("diagnoses").insert({
                "cache_key": cache_key,
                "root_cause": diagnosis.root_cause,
                "confidence": diagnosis.confidence,
                "evidence": diagnosis.evidence,
                "fix": diagnosis.fix,
                "impact_inr": diagnosis.impact_inr,
                "cached": False # Assuming not cached if we just generated it, get_diagnosis_logic already handles returning early
            }).execute()
        except Exception as e:
            print(f"Error saving diagnosis to supabase: {e}")

    return diagnosis

@app.post("/recovery", response_model=RecoveryResponse)
async def generate_recovery(diagnosis: dict):
    if not groq_client:
        return RecoveryResponse(
            message="Hey, we noticed you left some items in your cart. Come back and complete your purchase!",
            channel_suggestion="email"
        )
        
    system_prompt = """You are a conversion rate optimization expert. 
Given a diagnosis of cart abandonment, write a personalized, high-converting recovery message.
Also suggest the best channel to send this message (e.g., 'email', 'sms', 'whatsapp').

Return ONLY valid JSON with keys: 'message' and 'channel_suggestion'."""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(diagnosis)}
            ],
            max_tokens=250,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result_text = completion.choices[0].message.content
        result_json = json.loads(result_text)
        
        return RecoveryResponse(
            message=result_json.get("message", "We noticed you left something behind!"),
            channel_suggestion=result_json.get("channel_suggestion", "email")
        )
    except Exception as e:
        print(f"Groq API error for recovery: {e}")
        return RecoveryResponse(
            message="Hey, we noticed you left some items in your cart. Come back and complete your purchase!",
            channel_suggestion="email"
        )

@app.get("/diagnoses")
async def get_diagnoses():
    if not supabase:
        return []
    try:
        response = supabase.table("diagnoses") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Supabase error fetching diagnoses: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patterns")
async def get_patterns():
    if not supabase:
        return {}
    try:
        response = supabase.rpc("get_patterns", {}).execute()
        return response.data
    except Exception as e:
        print(f"Supabase error fetching patterns: {e}")
        raise HTTPException(status_code=500, detail="Database error. Ensure RPC 'get_patterns' is created.")

