CREATE TABLE IF NOT EXISTS public.dev_tools_audit_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('intent', 'pending')),
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_tools_audit_outbox_pending_idx
    ON public.dev_tools_audit_outbox (next_attempt_at, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS dev_tools_audit_outbox_intent_idx
    ON public.dev_tools_audit_outbox (created_at)
    WHERE status = 'intent';

ALTER TABLE public.dev_tools_audit_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.dev_tools_audit_outbox FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dev_tools_audit_outbox TO service_role;

CREATE POLICY "Service role manages DevTools audit outbox"
    ON public.dev_tools_audit_outbox
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
