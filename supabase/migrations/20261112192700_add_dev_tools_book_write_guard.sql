CREATE OR REPLACE FUNCTION public.insert_dev_tool_books(p_books jsonb)
RETURNS TABLE (id uuid, title text, author text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF jsonb_typeof(p_books) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'BOOK_BATCH_MUST_BE_AN_ARRAY';
    END IF;

    PERFORM pg_advisory_xact_lock(1280265795, 1);

    IF EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(p_books) AS candidate(title text, author text)
        WHERE candidate.title IS NULL OR candidate.author IS NULL
    ) THEN
        RAISE EXCEPTION 'BOOK_TITLE_AND_AUTHOR_ARE_REQUIRED';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(p_books) AS candidate(title text, author text)
        GROUP BY lower(btrim(regexp_replace(normalize(candidate.title, NFKC), '\s+', ' ', 'g'))),
                 lower(btrim(regexp_replace(normalize(candidate.author, NFKC), '\s+', ' ', 'g')))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'BOOK_NATURAL_KEY_CONFLICT';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_to_recordset(p_books) AS candidate(title text, author text)
        JOIN public.books AS existing
          ON lower(btrim(regexp_replace(normalize(existing.title, NFKC), '\s+', ' ', 'g'))) =
             lower(btrim(regexp_replace(normalize(candidate.title, NFKC), '\s+', ' ', 'g')))
         AND lower(btrim(regexp_replace(normalize(existing.author, NFKC), '\s+', ' ', 'g'))) =
             lower(btrim(regexp_replace(normalize(candidate.author, NFKC), '\s+', ' ', 'g')))
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'BOOK_NATURAL_KEY_CONFLICT';
    END IF;

    RETURN QUERY
    INSERT INTO public.books
    SELECT (jsonb_populate_record(NULL::public.books, candidate)).*
    FROM jsonb_array_elements(p_books) AS candidate
    RETURNING public.books.id, public.books.title, public.books.author;
END;
$$;

ALTER FUNCTION public.insert_dev_tool_books(jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.insert_dev_tool_books(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_dev_tool_books(jsonb) TO service_role;
