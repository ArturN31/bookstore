import { createClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

export function createPublicServerClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
    );
}
