CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_review_public(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = target_user_id
          AND are_reviews_public
    );
$$;

ALTER FUNCTION private.is_review_public(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION private.is_review_public(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_review_public(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.book_reviews;
DROP POLICY IF EXISTS "Public reviews are visible when enabled" ON public.book_reviews;
DROP POLICY IF EXISTS "Users can read their own reviews" ON public.book_reviews;

CREATE POLICY "Public reviews are visible when enabled"
ON public.book_reviews
FOR SELECT
TO anon, authenticated
USING (private.is_review_public(user_id));

CREATE POLICY "Users can read their own reviews"
ON public.book_reviews
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON FUNCTION public.get_user_profile(text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO service_role;
