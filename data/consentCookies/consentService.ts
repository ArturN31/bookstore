import { CONSENT_COOKIE_NAME, CONSENT_VERSION, ConsentState } from '@/utils/consentCookie';
import { cookies } from 'next/headers';

export async function getServerConsentCookie(): Promise<ConsentState | null> {
    try {
        const cookieStore = await cookies();
        const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME);
        if (!consentCookie?.value) return null;

        const parsed: ConsentState = JSON.parse(consentCookie.value);
        if (parsed.version !== CONSENT_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}
