import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

type QuerySuccess<T> = {
    data: T;
    error: null;
};

type QueryFailure = {
    data: null;
    error: string;
};

export type SafeQueryResult<T> = QuerySuccess<T> | QueryFailure;

export async function safeSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
): Promise<SafeQueryResult<T>> {
    try {
        const { data, error } = await queryFn();

        if (error)
            return {
                data: null,
                error: sanitizeSupabaseError(error),
            };

        if (data === null)
            return {
                data: null,
                error: 'No data returned.',
            };

        return {
            data,
            error: null,
        };
    } catch (err: unknown) {
        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
}
