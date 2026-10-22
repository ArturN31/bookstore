import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';
import { validateLocalSupabaseApiUrl } from './supabaseIntegration';

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationAnonKey = process.env.SUPABASE_INTEGRATION_ANON_KEY;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationAnonKey && integrationServiceKey);

const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Commerce RPC permissions integration', () => {
    let admin: SupabaseClient<Database>;
    let anonymous: SupabaseClient<Database>;
    let authenticated: SupabaseClient<Database>;
    const email = `rpc_permissions_${randomUUID()}@example.test`;
    const password = randomUUID();
    const webhookEventIds = [randomUUID(), randomUUID(), randomUUID()];
    let authUserId: string | null = null;

    beforeAll(async () => {
        if (!integrationUrl || !integrationAnonKey || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const apiUrl = await validateLocalSupabaseApiUrl(integrationUrl);

        admin = createClient<Database>(apiUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        anonymous = createClient<Database>(apiUrl, integrationAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        authenticated = createClient<Database>(apiUrl, integrationAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (createError) throw new Error(createError.message);
        authUserId = data.user.id;

        const { error: signInError } = await authenticated.auth.signInWithPassword({
            email,
            password,
        });
        if (signInError) throw new Error(signInError.message);
    });

    afterAll(async () => {
        if (!admin) return;

        const { error: eventsError } = await admin
            .from('webhook_events')
            .delete()
            .in('event_id', webhookEventIds);
        if (eventsError) throw new Error(eventsError.message);

        if (authUserId) {
            const { error } = await admin.auth.admin.deleteUser(authUserId);
            if (error) throw new Error(error.message);
        }
    });

    it('denies anon and authenticated roles access to privileged commerce RPCs', async () => {
        const deniedCalls = await Promise.all([
            anonymous.rpc('process_order_transaction', { p_payload: {} }),
            authenticated.rpc('process_order_transaction', { p_payload: {} }),
            anonymous.rpc('handle_stripe_webhook_transaction', {
                p_event_id: webhookEventIds[0],
                p_event_type: 'payment_intent.succeeded',
                p_payment_intent_id: 'pi_unauthorized',
            }),
            authenticated.rpc('handle_stripe_webhook_transaction', {
                p_event_id: webhookEventIds[1],
                p_event_type: 'payment_intent.succeeded',
                p_payment_intent_id: 'pi_unauthorized',
            }),
        ]);

        for (const { error } of deniedCalls) {
            expect(error?.code).toBe('42501');
        }
    });

    it('allows the server role to execute both RPCs', async () => {
        const orderResult = await admin.rpc('process_order_transaction', { p_payload: {} });
        expect(orderResult.error?.code).not.toBe('42501');
        expect(orderResult.error?.message).toContain('CHECKOUT_LOGIN_REQUIRED');

        const webhookResult = await admin.rpc('handle_stripe_webhook_transaction', {
            p_event_id: webhookEventIds[2],
            p_event_type: 'payment_intent.succeeded',
            p_payment_intent_id: 'pi_missing_order',
        });
        expect(webhookResult.error).toBeNull();
    });
});
