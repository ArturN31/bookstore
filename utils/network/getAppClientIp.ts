import { headers } from 'next/headers';
import { isIP } from 'node:net';

function normalizeIp(value: string | null): string | null {
    const candidate = value?.trim();
    if (candidate && isIP(candidate)) return candidate.toLowerCase();
    return null;
}

export async function getAppClientIp(): Promise<string> {
    const headerList = await headers();

    const platformIp =
        normalizeIp(headerList.get('cf-connecting-ip')) ??
        normalizeIp(headerList.get('x-real-ip'));
    if (platformIp) return platformIp;

    if (process.env.NODE_ENV === 'production')
        throw new Error(
            'No trusted client IP header was provided. Configure the edge proxy to set x-real-ip or cf-connecting-ip.',
        );

    return 'unknown';
}
