
  create table "public"."webhook_events" (
    "event_id" text not null,
    "event_type" text not null,
    "status" text not null default 'processing'::text,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
      );


alter table "public"."webhook_events" enable row level security;

alter table "public"."orders" add column "inventory_restored" boolean not null default false;

CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (event_id);

alter table "public"."webhook_events" add constraint "webhook_events_pkey" PRIMARY KEY using index "webhook_events_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_stripe_webhook_transaction(p_event_id text, p_event_type text, p_payment_intent_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order record;
    v_item record;
    v_cart record;
    v_target_status text;
BEGIN
    -- 1. Idempotency Check: Insert event into ledger. Duplicate IDs abort via unique violation.
    DECLARE
    BEGIN
        INSERT INTO public.webhook_events (event_id, event_type, status)
        VALUES (p_event_id, p_event_type, 'processing');
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', true, 'idempotent_skip', true);
    END;

    -- 2. Fetch Order with Row-Level Locking to prevent concurrent race conditions
    SELECT id, user_id, status, inventory_restored
    INTO v_order
    FROM public.orders
    WHERE stripe_payment_intent_id = p_payment_intent_id
    FOR UPDATE;

    IF NOT FOUND THEN
        UPDATE public.webhook_events SET status = 'order_not_found' WHERE event_id = p_event_id;
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    -- 3. Handle Event Types with Strict State Machine Rules
    IF p_event_type = 'payment_intent.succeeded' THEN
        -- If already paid, acknowledge idempotently
        IF v_order.status = 'paid' THEN
            UPDATE public.webhook_events SET status = 'processed_idempotent' WHERE event_id = p_event_id;
            RETURN jsonb_build_object('success', true, 'idempotent_skip', true);
        END IF;

        -- Guard: Only pending orders can transition to paid
        IF v_order.status <> 'pending' THEN
            UPDATE public.webhook_events SET status = 'invalid_state_transition' WHERE event_id = p_event_id;
            RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE_TRANSITION');
        END IF;

        -- Transition order to paid
        UPDATE public.orders
        SET status = 'paid'
        WHERE id = v_order.id;

        -- Clear user's shopping cart items atomically
        SELECT id INTO v_cart
        FROM public.shopping_carts
        WHERE user_id = v_order.user_id;

        IF FOUND THEN
            DELETE FROM public.shopping_cart_items
            WHERE cart_id = v_cart.id;
        END IF;

    ELSIF p_event_type IN ('payment_intent.payment_failed', 'payment_intent.canceled') THEN
        v_target_status := CASE WHEN p_event_type = 'payment_intent.canceled' THEN 'cancelled' ELSE 'failed' END;

        -- Critical Guard: A paid order is terminal. Failure webhooks must NEVER overwrite a paid order.
        IF v_order.status = 'paid' THEN
            UPDATE public.webhook_events SET status = 'ignored_paid_order' WHERE event_id = p_event_id;
            RETURN jsonb_build_object('success', true, 'ignored', true);
        END IF;

        IF v_order.status = v_target_status THEN
            UPDATE public.webhook_events SET status = 'processed_idempotent' WHERE event_id = p_event_id;
            RETURN jsonb_build_object('success', true, 'idempotent_skip', true);
        END IF;

        -- Update order status
        UPDATE public.orders
        SET status = v_target_status
        WHERE id = v_order.id;

        -- One-time conditional inventory restoration guard
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
    END IF;

    -- Mark webhook event processing complete
    UPDATE public.webhook_events SET status = 'completed' WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_order_transaction(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_total_amount numeric;
    v_subtotal numeric;
    v_discount_amount numeric;
    v_shipping_cost numeric;
    v_tax_amount numeric;
    v_shipping_method_id text;
    v_shipping_method_name text;
    v_payment_method text;
    v_discount_id uuid;
    v_payment_intent_id text;
    v_order_id uuid;
    v_item jsonb;
    v_book_id uuid;
    v_quantity smallint;
    v_price numeric;
    v_current_stock smallint;
    v_is_active boolean;
    
    v_shipping_address jsonb;
BEGIN
    -- Extract financial breakdown
    v_user_id := (p_payload->>'user_id')::uuid;
    v_total_amount := (p_payload->>'total_amount')::numeric;
    v_subtotal := COALESCE((p_payload->>'subtotal')::numeric, 0.00);
    v_discount_amount := COALESCE((p_payload->>'discount_amount')::numeric, 0.00);
    v_shipping_cost := COALESCE((p_payload->>'shipping_cost')::numeric, 0.00);
    v_tax_amount := COALESCE((p_payload->>'tax_amount')::numeric, 0.00);
    v_shipping_method_id := COALESCE(p_payload->>'shipping_method_id', 'royal_mail_standard');
    v_shipping_method_name := COALESCE(p_payload->>'shipping_method_name', 'Royal Mail Standard');
    v_payment_method := p_payload->>'payment_method';
    v_payment_intent_id := p_payload->>'payment_intent_id';
    v_shipping_address := p_payload->'shipping_address';

    IF p_payload->>'discount_id' IS NOT NULL AND p_payload->>'discount_id' <> '' THEN
        v_discount_id := (p_payload->>'discount_id')::uuid;
    ELSE
        v_discount_id := NULL;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'CHECKOUT_LOGIN_REQUIRED';
    END IF;

    IF v_total_amount IS NULL OR v_total_amount <= 0 THEN
        RAISE EXCEPTION 'ORDER_CREATION_FAILED';
    END IF;

    IF v_payment_intent_id IS NULL OR v_payment_intent_id = '' THEN
        RAISE EXCEPTION 'PAYMENT_PROCESSING_FAILED';
    END IF;

    IF jsonb_array_length(p_payload->'items') = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART_CHECKOUT';
    END IF;

    -- Lock and validate stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
        v_book_id := (v_item->>'book_id')::uuid;
        v_quantity := (v_item->>'quantity')::smallint;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'ORDER_CREATION_FAILED';
        END IF;

        SELECT stock_quantity, is_active 
        INTO v_current_stock, v_is_active
        FROM public.books
        WHERE id = v_book_id
        FOR UPDATE;

        IF NOT FOUND OR NOT v_is_active OR v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK';
        END IF;
    END LOOP;

    -- Insert order record with full financial ledger
    INSERT INTO public.orders (
        user_id,
        subtotal,
        discount_amount,
        shipping_cost,
        tax_amount,
        total_amount,
        shipping_method_id,
        shipping_method_name,
        status,
        payment_method,
        stripe_payment_intent_id
    ) VALUES (
        v_user_id,
        v_subtotal,
        v_discount_amount,
        v_shipping_cost,
        v_tax_amount,
        v_total_amount,
        v_shipping_method_id,
        v_shipping_method_name,
        'pending',
        v_payment_method,
        v_payment_intent_id
    ) RETURNING id INTO v_order_id;

    -- Insert immutable shipping address record
    IF v_shipping_address IS NOT NULL THEN
        INSERT INTO public.order_addresses (
            order_id,
            address_type,
            first_name,
            last_name,
            street_address,
            city,
            postcode,
            country,
            phone_number
        ) VALUES (
            v_order_id,
            'shipping',
            COALESCE(v_shipping_address->>'firstName', ''),
            COALESCE(v_shipping_address->>'lastName', ''),
            COALESCE(v_shipping_address->>'streetAddress', ''),
            COALESCE(v_shipping_address->>'city', ''),
            COALESCE(v_shipping_address->>'postcode', ''),
            COALESCE(v_shipping_address->>'country', 'United Kingdom'),
            COALESCE(v_shipping_address->>'phoneNumber', '')
        );
    END IF;

    -- Insert items & reduce stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items')
    LOOP
        v_book_id := (v_item->>'book_id')::uuid;
        v_quantity := (v_item->>'quantity')::smallint;
        v_price := (v_item->>'price')::numeric;

        INSERT INTO public.order_items (order_id, book_id, quantity, price)
        VALUES (v_order_id, v_book_id, v_quantity, v_price);

        UPDATE public.books
        SET 
            stock_quantity = stock_quantity - v_quantity,
            sales_count = COALESCE(sales_count, 0) + v_quantity,
            updated_at = (now() AT TIME ZONE 'utc'::text)
        WHERE id = v_book_id;
    END LOOP;

    -- Attach discount
    IF v_discount_id IS NOT NULL THEN
        INSERT INTO public.order_discounts (order_id, discount_id)
        VALUES (v_order_id, v_discount_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$function$
;

grant delete on table "public"."webhook_events" to "anon";

grant insert on table "public"."webhook_events" to "anon";

grant references on table "public"."webhook_events" to "anon";

grant select on table "public"."webhook_events" to "anon";

grant trigger on table "public"."webhook_events" to "anon";

grant truncate on table "public"."webhook_events" to "anon";

grant update on table "public"."webhook_events" to "anon";

grant delete on table "public"."webhook_events" to "authenticated";

grant insert on table "public"."webhook_events" to "authenticated";

grant references on table "public"."webhook_events" to "authenticated";

grant select on table "public"."webhook_events" to "authenticated";

grant trigger on table "public"."webhook_events" to "authenticated";

grant truncate on table "public"."webhook_events" to "authenticated";

grant update on table "public"."webhook_events" to "authenticated";

grant delete on table "public"."webhook_events" to "service_role";

grant insert on table "public"."webhook_events" to "service_role";

grant references on table "public"."webhook_events" to "service_role";

grant select on table "public"."webhook_events" to "service_role";

grant trigger on table "public"."webhook_events" to "service_role";

grant truncate on table "public"."webhook_events" to "service_role";

grant update on table "public"."webhook_events" to "service_role";


