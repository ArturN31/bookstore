export const DEV_TOOLS_UNAVAILABLE_MESSAGE =
    'Unauthorized: Dev tools are only available when running npm run dev.';

export function isDevToolsEnabled(): boolean {
    return process.env.NODE_ENV === 'development' && process.env.FORCE_PRODUCTION !== 'true';
}
