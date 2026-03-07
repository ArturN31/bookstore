import { createBrowserClient } from '@supabase/ssr';

export function createFrontendClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
    );
}
