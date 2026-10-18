


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_public_profile"("target_username" "text") RETURNS TABLE("id" "uuid", "username" "text", "created_at" timestamp with time zone, "is_wishlist_public" boolean, "are_reviews_public" boolean, "is_profile_public" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        u.id,
        u.username,
        u.created_at,
        u.is_wishlist_public,
        u.are_reviews_public,
        u.is_profile_public
    FROM public.users u
    WHERE u.username = target_username;
$$;


ALTER FUNCTION "public"."get_public_profile"("target_username" "text") OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."books_with_stats" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"text" AS "title",
    NULL::"text" AS "author",
    NULL::"text" AS "genre",
    NULL::"text" AS "publisher",
    NULL::"date" AS "publication_date",
    NULL::"text" AS "price",
    NULL::"text" AS "description",
    NULL::"text" AS "format",
    NULL::smallint AS "page_count",
    NULL::"text" AS "image_url",
    NULL::smallint AS "stock_quantity",
    NULL::boolean AS "is_active",
    NULL::integer AS "sales_count",
    NULL::numeric AS "avg_rating",
    NULL::bigint AS "review_count";


ALTER VIEW "public"."books_with_stats" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_related_books"("target_book_id" "uuid", "limit_count" integer DEFAULT 4) RETURNS SETOF "public"."books_with_stats"
    LANGUAGE "plpgsql"
    AS $$
declare
  target_author text;
  target_genre text;
  target_publisher text;
begin
  -- Retrieve properties of the target book
  select author, genre, publisher
  into target_author, target_genre, target_publisher
  from public.books
  where id = target_book_id;

  -- If the book does not exist, return an empty set
  if not found then
    return;
  end if;

  return query
  select b.*
  from public.books_with_stats b
  where b.id <> target_book_id
    and b.is_active = true
  order by
    (
      (case when b.author = target_author then 50.0 else 0.0 end) +
      (case when b.genre = target_genre then 30.0 else 0.0 end) +
      (case when b.publisher = target_publisher then 10.0 else 0.0 end) +
      (coalesce(b.avg_rating, 0.0) * 1.5) +
      (least(coalesce(b.sales_count, 0)::numeric / 100.0, 5.0))
    ) desc,
    b.sales_count desc,
    b.avg_rating desc
  limit limit_count;
end;
$$;


ALTER FUNCTION "public"."get_related_books"("target_book_id" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile"("target_username" "text") RETURNS TABLE("id" "uuid", "username" "text", "avatar_url" "text", "bio" "text", "is_profile_public" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.avatar_url,
        u.bio,
        u.is_profile_public,
        u.created_at,
        u.updated_at
    FROM users u
    WHERE u.username = target_username;
END;
$$;


ALTER FUNCTION "public"."get_user_profile"("target_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_stripe_webhook_transaction"("p_event_id" "text", "p_event_type" "text", "p_payment_intent_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_stripe_webhook_transaction"("p_event_id" "text", "p_event_type" "text", "p_payment_intent_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_book_stock"("p_book_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    UPDATE public.books
    SET 
        stock_quantity = stock_quantity + p_quantity,
        sales_count = GREATEST(0, COALESCE(sales_count, 0) - p_quantity),
        updated_at = (now() AT TIME ZONE 'utc'::text)
    WHERE id = p_book_id;
END;
$$;


ALTER FUNCTION "public"."increment_book_stock"("p_book_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_order_transaction"("p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."process_order_transaction"("p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_book_sales_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.books
    SET sales_count = sales_count + NEW.quantity
    WHERE id = NEW.book_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_book_sales_count"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."book_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "book_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "review" "text" NOT NULL,
    "rating" smallint NOT NULL,
    "username" "text" NOT NULL,
    CONSTRAINT "review_length_check" CHECK (("char_length"("review") <= 2000))
);


ALTER TABLE "public"."book_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."books" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "title" "text" NOT NULL,
    "author" "text" NOT NULL,
    "genre" "text" NOT NULL,
    "publisher" "text" NOT NULL,
    "publication_date" "date" NOT NULL,
    "price" "text" NOT NULL,
    "description" "text" NOT NULL,
    "format" "text" NOT NULL,
    "page_count" smallint NOT NULL,
    "image_url" "text" NOT NULL,
    "stock_quantity" smallint NOT NULL,
    "is_active" boolean NOT NULL,
    "sales_count" integer DEFAULT 0,
    "stripe_product_id" "text",
    "stripe_price_id" "text"
);


ALTER TABLE "public"."books" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "code" "text" NOT NULL,
    "type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "value" numeric NOT NULL,
    "start_date" timestamp without time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp without time zone NOT NULL,
    "is_active" boolean NOT NULL,
    "minimum_subtotal" numeric,
    "stripe_coupon_id" "text",
    "usage_limit" integer,
    "times_used" integer DEFAULT 0 NOT NULL,
    "uses_per_user" integer
);


ALTER TABLE "public"."discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "order_id" "uuid" NOT NULL,
    "address_type" "text" DEFAULT 'shipping'::"text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "street_address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "postcode" "text" NOT NULL,
    "country" "text" NOT NULL,
    "phone_number" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."order_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "discount_id" "uuid" NOT NULL
);


ALTER TABLE "public"."order_discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "order_id" "uuid" NOT NULL,
    "book_id" "uuid" NOT NULL,
    "quantity" smallint NOT NULL,
    "price" numeric NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "total_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "subtotal" numeric DEFAULT 0.00 NOT NULL,
    "discount_amount" numeric DEFAULT 0.00 NOT NULL,
    "shipping_cost" numeric DEFAULT 0.00 NOT NULL,
    "tax_amount" numeric DEFAULT 0.00 NOT NULL,
    "shipping_method_id" "text" DEFAULT 'royal_mail_standard'::"text" NOT NULL,
    "shipping_method_name" "text" DEFAULT 'Royal Mail Standard'::"text" NOT NULL,
    "inventory_restored" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_cart_items" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "cart_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "book_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quantity" numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE "public"."shopping_cart_items" OWNER TO "postgres";


ALTER TABLE "public"."shopping_cart_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopping_cart_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopping_carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."shopping_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "text" NOT NULL,
    "street_address" "text" NOT NULL,
    "postcode" "text" NOT NULL,
    "city" "text" NOT NULL,
    "country" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "username" "text" NOT NULL,
    "is_wishlist_public" boolean DEFAULT false NOT NULL,
    "wishlist_share_token" "uuid" DEFAULT "gen_random_uuid"(),
    "are_reviews_public" boolean DEFAULT false NOT NULL,
    "is_profile_public" boolean DEFAULT false NOT NULL,
    "stripe_customer_id" "text",
    CONSTRAINT "users_username_format_check" CHECK (("username" ~ '^[a-zA-Z0-9_-]+$'::"text"))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "book_id" "uuid" NOT NULL
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."books"
    ADD CONSTRAINT "books_stripe_product_id_key" UNIQUE ("stripe_product_id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discounts"
    ADD CONSTRAINT "discounts_stripe_coupon_id_key" UNIQUE ("stripe_coupon_id");



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "one_review_per_user_per_book" UNIQUE ("user_id", "book_id");



ALTER TABLE ONLY "public"."order_addresses"
    ADD CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_discounts"
    ADD CONSTRAINT "order_discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_cart_id_book_id_key" UNIQUE ("cart_id", "book_id");



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_carts"
    ADD CONSTRAINT "shopping_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_book_id_key" UNIQUE ("user_id", "book_id");



CREATE INDEX "idx_books_sales_count" ON "public"."books" USING "btree" ("sales_count" DESC);



CREATE INDEX "idx_order_items_book_id" ON "public"."order_items" USING "btree" ("book_id");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE OR REPLACE VIEW "public"."books_with_stats" WITH ("security_invoker"='on') AS
 SELECT "b"."id",
    "b"."created_at",
    "b"."updated_at",
    "b"."title",
    "b"."author",
    "b"."genre",
    "b"."publisher",
    "b"."publication_date",
    "b"."price",
    "b"."description",
    "b"."format",
    "b"."page_count",
    "b"."image_url",
    "b"."stock_quantity",
    "b"."is_active",
    "b"."sales_count",
    COALESCE("avg"("r"."rating"), (0)::numeric) AS "avg_rating",
    "count"("r"."id") AS "review_count"
   FROM ("public"."books" "b"
     LEFT JOIN "public"."book_reviews" "r" ON (("b"."id" = "r"."book_id")))
  GROUP BY "b"."id";



CREATE OR REPLACE TRIGGER "trigger_update_sales" AFTER INSERT ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_book_sales_count"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."book_reviews"
    ADD CONSTRAINT "book_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_addresses"
    ADD CONSTRAINT "order_addresses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_discounts"
    ADD CONSTRAINT "order_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_discounts"
    ADD CONSTRAINT "order_discounts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."shopping_carts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_carts"
    ADD CONSTRAINT "shopping_carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to delete their shopping cart items" ON "public"."shopping_cart_items" FOR DELETE TO "authenticated" USING (("cart_id" IN ( SELECT "shopping_carts"."id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow authenticated users to read their shopping cart items" ON "public"."shopping_cart_items" FOR SELECT TO "authenticated" USING (("cart_id" IN ( SELECT "shopping_carts"."id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow authenticated users to update their shopping cart items" ON "public"."shopping_cart_items" FOR UPDATE TO "authenticated" USING (("cart_id" IN ( SELECT "shopping_carts"."id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (true);



CREATE POLICY "Allow server-side insertion of audit logs" ON "public"."audit_logs" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Allow users to read active discounts" ON "public"."discounts" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow users to update their own reviews" ON "public"."book_reviews" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."book_reviews" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."shopping_carts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."wishlist" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."book_reviews" FOR INSERT TO "authenticated", "service_role" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."books" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."shopping_cart_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."shopping_carts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."wishlist" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."book_reviews" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."books" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users on user_id" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."shopping_carts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."wishlist" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view discounts" ON "public"."discounts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view order discounts for their own orders" ON "public"."order_discounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_discounts"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."book_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."books" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."book_reviews";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."books";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopping_cart_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shopping_carts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."get_public_profile"("target_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_profile"("target_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_profile"("target_username" "text") TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books_with_stats" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books_with_stats" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books_with_stats" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_related_books"("target_book_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_related_books"("target_book_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_related_books"("target_book_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile"("target_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"("target_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile"("target_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_stripe_webhook_transaction"("p_event_id" "text", "p_event_type" "text", "p_payment_intent_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_stripe_webhook_transaction"("p_event_id" "text", "p_event_type" "text", "p_payment_intent_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_stripe_webhook_transaction"("p_event_id" "text", "p_event_type" "text", "p_payment_intent_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_book_stock"("p_book_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_book_stock"("p_book_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_book_stock"("p_book_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_order_transaction"("p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_order_transaction"("p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_order_transaction"("p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_book_sales_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_book_sales_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_book_sales_count"() TO "service_role";
























GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."audit_logs" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."book_reviews" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."book_reviews" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."book_reviews" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."books" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."discounts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."discounts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."discounts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_addresses" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_addresses" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_addresses" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_discounts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_discounts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_discounts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."order_items" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."orders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_cart_items" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_cart_items" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_cart_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_carts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_carts" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."shopping_carts" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."users" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."webhook_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."webhook_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."webhook_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wishlist" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wishlist" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."wishlist" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Enable insert for authenticated users only" on "public"."book_reviews";


  create policy "Enable insert for authenticated users only"
  on "public"."book_reviews"
  as permissive
  for insert
  to service_role, authenticated
with check (true);



