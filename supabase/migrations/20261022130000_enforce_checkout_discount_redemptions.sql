ALTER TABLE public.order_discounts
ADD COLUMN IF NOT EXISTS usage_counted boolean NOT NULL DEFAULT false;

WITH active_redemptions AS (
    SELECT
        order_discount.discount_id,
        count(DISTINCT order_discount.order_id)::integer AS redemption_count
    FROM public.order_discounts AS order_discount
    JOIN public.orders AS customer_order
      ON customer_order.id = order_discount.order_id
    WHERE customer_order.status IN ('pending', 'paid', 'shipped', 'completed')
    GROUP BY order_discount.discount_id
)
UPDATE public.discounts AS discount
SET times_used = GREATEST(discount.times_used, active_redemptions.redemption_count)
FROM active_redemptions
WHERE discount.id = active_redemptions.discount_id;

UPDATE public.order_discounts AS order_discount
SET usage_counted = true
FROM public.orders AS customer_order
WHERE customer_order.id = order_discount.order_id
  AND customer_order.status IN ('pending', 'paid', 'shipped', 'completed');

CREATE OR REPLACE FUNCTION private.reserve_checkout_discount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_discount public.discounts%ROWTYPE;
    v_order_status text;
    v_user_id uuid;
    v_subtotal numeric;
    v_user_redemptions integer;
    v_now timestamp without time zone := timezone('UTC', now());
BEGIN
    NEW.usage_counted := false;

    SELECT user_id, subtotal, status
    INTO v_user_id, v_subtotal, v_order_status
    FROM public.orders
    WHERE id = NEW.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;

    IF v_order_status IN ('failed', 'cancelled') THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.order_discounts AS existing_discount
        WHERE existing_discount.order_id = NEW.order_id
          AND existing_discount.discount_id = NEW.discount_id
    ) THEN
        RAISE EXCEPTION 'DISCOUNT_ALREADY_APPLIED';
    END IF;

    SELECT *
    INTO v_discount
    FROM public.discounts
    WHERE id = NEW.discount_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_discount.is_active THEN
        RAISE EXCEPTION 'DISCOUNT_NOT_ACTIVE';
    END IF;

    IF v_discount.start_date > v_now THEN
        RAISE EXCEPTION 'DISCOUNT_NOT_ACTIVE';
    END IF;

    IF v_discount.end_date < v_now THEN
        RAISE EXCEPTION 'EXPIRED_DISCOUNT_CODE';
    END IF;

    IF v_discount.minimum_subtotal IS NOT NULL
       AND v_subtotal < v_discount.minimum_subtotal THEN
        RAISE EXCEPTION 'DISCOUNT_MINIMUM_SUBTOTAL_NOT_MET';
    END IF;

    IF v_discount.usage_limit IS NOT NULL
       AND v_discount.times_used >= v_discount.usage_limit THEN
        RAISE EXCEPTION 'DISCOUNT_USAGE_LIMIT_REACHED';
    END IF;

    IF v_discount.uses_per_user IS NOT NULL THEN
        SELECT count(DISTINCT order_discount.order_id)::integer
        INTO v_user_redemptions
        FROM public.order_discounts AS order_discount
        JOIN public.orders AS existing_order
          ON existing_order.id = order_discount.order_id
        WHERE order_discount.discount_id = NEW.discount_id
          AND existing_order.user_id = v_user_id
          AND existing_order.status IN ('pending', 'paid', 'shipped', 'completed');

        IF v_user_redemptions >= v_discount.uses_per_user THEN
            RAISE EXCEPTION 'DISCOUNT_USER_LIMIT_REACHED';
        END IF;
    END IF;

    UPDATE public.discounts
    SET times_used = times_used + 1,
        updated_at = v_now
    WHERE id = NEW.discount_id;

    NEW.usage_counted := true;
    RETURN NEW;
END;
$$;

ALTER FUNCTION private.reserve_checkout_discount() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.reserve_checkout_discount() FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (usage_counted) ON public.order_discounts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.release_checkout_discount_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    WITH released AS (
        UPDATE public.order_discounts
        SET usage_counted = false
        WHERE order_id = NEW.id
          AND usage_counted
        RETURNING discount_id
    ),
    release_counts AS (
        SELECT discount_id, count(*)::integer AS count
        FROM released
        GROUP BY discount_id
    )
    UPDATE public.discounts AS discount
    SET times_used = GREATEST(0, discount.times_used - release_counts.count),
        updated_at = timezone('UTC', now())
    FROM release_counts
    WHERE discount.id = release_counts.discount_id;

    RETURN NEW;
END;
$$;

ALTER FUNCTION private.release_checkout_discount_reservation() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.release_checkout_discount_reservation()
FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.release_deleted_checkout_discount_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.usage_counted THEN
        UPDATE public.discounts
        SET times_used = GREATEST(0, times_used - 1),
            updated_at = timezone('UTC', now())
        WHERE id = OLD.discount_id;
    END IF;

    RETURN OLD;
END;
$$;

ALTER FUNCTION private.release_deleted_checkout_discount_reservation() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.release_deleted_checkout_discount_reservation()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reserve_checkout_discount ON public.order_discounts;
CREATE TRIGGER reserve_checkout_discount
BEFORE INSERT ON public.order_discounts
FOR EACH ROW
EXECUTE FUNCTION private.reserve_checkout_discount();

DROP TRIGGER IF EXISTS release_checkout_discount_reservation ON public.orders;
CREATE TRIGGER release_checkout_discount_reservation
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status IN ('failed', 'cancelled'))
EXECUTE FUNCTION private.release_checkout_discount_reservation();

DROP TRIGGER IF EXISTS release_deleted_checkout_discount_reservation ON public.order_discounts;
CREATE TRIGGER release_deleted_checkout_discount_reservation
AFTER DELETE ON public.order_discounts
FOR EACH ROW
EXECUTE FUNCTION private.release_deleted_checkout_discount_reservation();
