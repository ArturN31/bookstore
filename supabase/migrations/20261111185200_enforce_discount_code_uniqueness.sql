CREATE UNIQUE INDEX discounts_normalized_code_key
ON public.discounts (upper(btrim(code)));
