REVOKE ALL ON FUNCTION public.process_order_transaction(jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_order_transaction(jsonb)
TO service_role;

REVOKE ALL ON FUNCTION public.handle_stripe_webhook_transaction(text, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_stripe_webhook_transaction(text, text, text)
TO service_role;
