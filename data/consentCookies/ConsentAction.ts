'use server';

import { createBackendClient } from '@/utils/db/server';

export async function saveUserConsentToSupabase(
    analytics: boolean,
    version: string,
): Promise<void> {
    const supabase = await createBackendClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('user_consents').upsert(
        {
            user_id: user.id,
            analytics,
            version,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
    );
}
