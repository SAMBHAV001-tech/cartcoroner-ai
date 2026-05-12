-- Create abandoned_carts table
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_value FLOAT NOT NULL,
    product_categories JSONB NOT NULL,
    customer_email TEXT,
    abandonment_step TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create diagnoses table
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES public.abandoned_carts(id),
    cache_key TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    evidence JSONB NOT NULL,
    fix TEXT NOT NULL,
    impact_inr INT NOT NULL,
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster cache lookups
CREATE INDEX IF NOT EXISTS idx_diagnoses_cache_key ON public.diagnoses(cache_key);

-- RPC for /patterns endpoint
CREATE OR REPLACE FUNCTION get_patterns()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'root_cause_stats', (
            SELECT json_agg(row_to_json(t)) FROM (
                SELECT root_cause, COUNT(*) as count, AVG(impact_inr) as avg_impact_inr
                FROM public.diagnoses
                GROUP BY root_cause
            ) t
        ),
        'cart_value_stats', (
            SELECT json_agg(row_to_json(t)) FROM (
                SELECT 
                    CASE
                        WHEN ac.cart_value <= 1000 THEN '0-1000'
                        WHEN ac.cart_value <= 3000 THEN '1000-3000'
                        WHEN ac.cart_value <= 5000 THEN '3000-5000'
                        ELSE '5000+'
                    END as bucket,
                    COUNT(*) as count
                FROM public.diagnoses d
                LEFT JOIN public.abandoned_carts ac ON d.cart_id = ac.id
                GROUP BY bucket
            ) t
        ),
        'abandonment_step_stats', (
            SELECT json_agg(row_to_json(t)) FROM (
                SELECT ac.abandonment_step, COUNT(*) as count
                FROM public.diagnoses d
                LEFT JOIN public.abandoned_carts ac ON d.cart_id = ac.id
                GROUP BY ac.abandonment_step
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
