/** Error shown when DevTools are unavailable outside the development environment. */
export const DEV_TOOLS_UNAVAILABLE_MESSAGE =
    'Unauthorized: Dev tools are only available when running npm run dev.';

/** Error shown when the active Supabase target is not explicitly allowlisted for DevTools. */
export const DEV_TOOLS_DATABASE_TARGET_ERROR =
    'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.';

/**
 * Checks whether DevTools are enabled in the current runtime environment.
 *
 * @returns True only in a development process that is not forced to production behavior.
 */
export function isDevToolsEnabled(): boolean {
    return process.env.NODE_ENV === 'development' && process.env.FORCE_PRODUCTION !== 'true';
}

/**
 * Checks whether the active Supabase API URL exactly matches the configured allowlisted URL.
 *
 * @returns True only when both URLs are valid API origins with no credentials or extra URL components.
 */
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
