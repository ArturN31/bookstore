set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cancel_user_order(p_order_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order record;
    v_item record;
BEGIN
    -- 1. Fetch Order with Row-Level Locking to prevent concurrent race conditions
    SELECT id, user_id, status, inventory_restored
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    -- 2. Strict State Machine Guard: Only pending orders can be cancelled by users
    IF v_order.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_CANCEL_ORDER');
    END IF;

    -- 3. Update order status to cancelled
    UPDATE public.orders
    SET status = 'cancelled', updated_at = (now() AT TIME ZONE 'utc'::text)
    WHERE id = v_order.id;

    -- 4. One-time conditional inventory restoration guard
    IF NOT v_order.inventory_restored THEN
        FOR v_item IN 
            SELECT book_id, quantity 
            FROM public.order_items 
            WHERE order_id = v_order.id
        LOOP
            UPDATE public.books
            SET 
                stock_quantity = stock_quantity + v_item.quantity,
                sales_count = GREATEST(0, COALESCE(sales_count, 0) - v_item.quantity),
                updated_at = (now() AT TIME ZONE 'utc'::text)
            WHERE id = v_item.book_id;
        END LOOP;

        UPDATE public.orders
        SET inventory_restored = true
        WHERE id = v_order.id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$function$
;


