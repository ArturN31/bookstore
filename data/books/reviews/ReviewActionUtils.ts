import { createBackendClient } from '@/utils/db/server';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

export interface UserTableRow {
    username: string | null;
}

export type SupabaseClient = Awaited<ReturnType<typeof createBackendClient>>;
export type AuthUser = NonNullable<
    Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']
>;

export function isDuplicateReviewError(dbError: unknown, sanitizedError: string): boolean {
    if (sanitizedError === DB_ERROR_MAP['23505']) return true;

    if (typeof dbError === 'object' && dbError !== null) {
        const errObj = dbError as { code?: unknown; message?: unknown; details?: unknown };
        if (typeof errObj.code === 'string' && errObj.code === '23505') return true;

        const message = typeof errObj.message === 'string' ? errObj.message.toLowerCase() : '';
        const details = typeof errObj.details === 'string' ? errObj.details.toLowerCase() : '';

        if (message.includes('23505') || message.includes('duplicate')) return true;
        if (details.includes('23505') || details.includes('duplicate')) return true;
    }

    if (typeof dbError === 'string') {
        const lowerDbError = dbError.toLowerCase();
        return lowerDbError.includes('23505') || lowerDbError.includes('duplicate');
    }

    return false;
}

export async function resolveUsername(
    supabase: SupabaseClient,
    user: AuthUser,
    providedUsername?: string,
): Promise<string> {
    if (providedUsername && providedUsername.trim() !== '') {
        return providedUsername.trim();
    }

    const result = await safeSupabaseQuery<UserTableRow>(async () =>
        supabase.from('users').select('username').eq('id', user.id).maybeSingle<UserTableRow>(),
    );

    const fetchedUsername = result.data?.username?.trim();

    return (
        fetchedUsername ||
        (typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username.trim()
            : '') ||
        user.email?.split('@')[0] ||
        'Anonymous'
    );
}
