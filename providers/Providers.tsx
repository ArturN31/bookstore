'use client';

import { CartProvider } from '@/providers/cart/CartProvider';
import { UserProvider } from '@/providers/user/UserProvider';
import { SnackbarProvider } from 'notistack';
import { BookSortByProvider } from './BookSortByProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { BookAdvancedFilteringProvider } from './advancedFiltering/BookAdvancedFilteringProvider';
import { ConsentProvider, ConsentState } from './ConsentProvider';
import { Analytics } from '@vercel/analytics/next';
import ConsentBanner from '@/components/consent/ConsentBanner';

export interface SessionData {
    initialUser: User | null;
    initialWishlist: Wishlist[] | null;
    initialCart: Cart | null;
    initialConsent: ConsentState | null;
    hasAnalyticsConsent: boolean;
}

export const Providers = ({
    initialSessionData,
    children,
}: {
    initialSessionData?: SessionData;
    children: React.ReactNode;
}) => {
    const data = initialSessionData ?? {
        initialUser: null,
        initialWishlist: [],
        initialCart: null,
        initialConsent: null,
        hasAnalyticsConsent: false,
    };

    return (
        <AppRouterCacheProvider>
            <BookAdvancedFilteringProvider>
                <BookSortByProvider>
                    <UserProvider
                        initialUser={data.initialUser}
                        initialWishlist={data.initialWishlist}
                    >
                        <CartProvider initialCart={data.initialCart}>
                            <ConsentProvider initialConsent={data.initialConsent}>
                                <SnackbarProvider
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                >
                                    {children}
                                    <ConsentBanner />
                                    {data.hasAnalyticsConsent && <Analytics />}
                                </SnackbarProvider>
                            </ConsentProvider>
                        </CartProvider>
                    </UserProvider>
                </BookSortByProvider>
            </BookAdvancedFilteringProvider>
        </AppRouterCacheProvider>
    );
};
