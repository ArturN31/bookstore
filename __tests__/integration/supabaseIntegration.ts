export async function validateLocalSupabaseApiUrl(value: string): Promise<string> {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error(
            'SUPABASE_INTEGRATION_URL must be the local Supabase API_URL, such as http://127.0.0.1:54321.',
        );
    }

    if (
        !['localhost', '127.0.0.1', '::1'].includes(url.hostname) ||
        url.protocol !== 'http:'
    )
        throw new Error('Database integration tests only run against the local Supabase API_URL.');

    if (url.pathname !== '/' || url.search || url.hash)
        throw new Error(
            'SUPABASE_INTEGRATION_URL must be the base API_URL (for example http://127.0.0.1:54321), not REST_URL, DB_URL, or a Storage URL.',
        );

    const apiUrl = url.origin;
    const health = await fetch(`${apiUrl}/auth/v1/health`);
    if (!health.ok || !health.headers.get('content-type')?.includes('application/json'))
        throw new Error(
            `SUPABASE_INTEGRATION_URL does not point to the local Supabase API (auth health check returned HTTP ${health.status}). Use API_URL from npx supabase status -o env.`,
        );

    return apiUrl;
}
