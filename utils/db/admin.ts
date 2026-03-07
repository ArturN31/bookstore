import { createClient } from '@supabase/supabase-js';

// This client bypasses RLS and should ONLY be used in server-side seeding/scripts
export const createAdminClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

    return createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
