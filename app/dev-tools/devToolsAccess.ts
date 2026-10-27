export const DEV_TOOLS_UNAVAILABLE_MESSAGE =
    'Unauthorized: Dev tools are only available when running npm run dev.';

export const DEV_TOOLS_DATABASE_TARGET_ERROR =
    'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.';

export function isDevToolsEnabled(): boolean {
    return process.env.NODE_ENV === 'development' && process.env.FORCE_PRODUCTION !== 'true';
}

export function isDevToolsDatabaseTargetAllowed(): boolean {
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL?.trim();
    const allowedUrl = process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL?.trim();

    if (!configuredUrl || !allowedUrl) return false;

    try {
        const active = new URL(configuredUrl);
        const expected = new URL(allowedUrl);
        const isValidApiUrl = (url: URL) =>
            ['http:', 'https:'].includes(url.protocol) &&
            (url.pathname === '' || url.pathname === '/') &&
            !url.username &&
            !url.password &&
            !url.search &&
            !url.hash;

        return isValidApiUrl(active) && isValidApiUrl(expected) && active.origin === expected.origin;
    } catch {
        return false;
    }
}
