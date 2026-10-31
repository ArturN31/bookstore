import { getCartData } from '@/data/cart/CartService';
import { saveUserConsentToSupabase } from '@/data/consentCookies/ConsentAction';
import { getUserData, getUserWishlist } from '@/data/user/UserService';
import { mapCartData } from '@/providers/cart/utils/CartMapper';
import { CONSENT_COOKIE_NAME, CONSENT_VERSION, ConsentState } from '@/providers/ConsentProvider';
import { Providers } from '@/providers/Providers';
import { DEFAULT_USER } from '@/providers/user/UserContext';
import { mapUserData } from '@/providers/user/utils/UserMapper';
import { createBackendClient } from '@/utils/db/server';
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

export const SessionProviderWrapper = async ({
    children,
}: {
    children: React.ReactNode;
}): Promise<React.JSX.Element> => {
    const supabase = await createBackendClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let initialUser: User | null = null;
    let initialWishlist: Wishlist[] = [];
    let initialCart: Cart | null = null;

    const initialConsent: ConsentState | null = await getServerConsentCookie();

    if (user) {
        if (initialConsent)
            try {
                await saveUserConsentToSupabase(initialConsent.analytics, initialConsent.version);
            } catch {
                // Fail silently if network/db error occurs during sync
            }

        const [userRes, wishlistRes, cartRes] = await Promise.all([
            getUserData(),
            getUserWishlist(),
            getCartData(user.id),
        ]);

        if (!userRes.error && userRes.data) initialUser = mapUserData(userRes.data);
        else initialUser = { ...DEFAULT_USER, id: user.id };

        if (!wishlistRes.error && wishlistRes.data) initialWishlist = wishlistRes.data;

        if (!cartRes.error && cartRes.data?.books) initialCart = mapCartData(cartRes.data.books);
    }

    const initialSessionData = {
        initialUser,
        initialWishlist,
        initialCart,
        initialConsent,
        hasAnalyticsConsent: initialConsent?.analytics === true,
    };

    return (
        <Providers
            key={user?.id || 'guest'}
            initialSessionData={initialSessionData}
        >
            {children}
        </Providers>
    );
};
