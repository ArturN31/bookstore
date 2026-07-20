'use client';

import { CartProvider } from '@/providers/cart/CartProvider';
import { UserProvider } from '@/providers/user/UserProvider';
import { SnackbarProvider } from 'notistack';
import { BookSortByProvider } from './BookSortByProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { BookAdvancedFilteringProvider } from './advancedFiltering/BookAdvancedFilteringProvider';

interface SessionData {
    initialUser: User | null;
    initialWishlist: Wishlist[] | null;
    initialCart: Cart | null;
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
                            <SnackbarProvider
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                            >
                                {children}
                            </SnackbarProvider>
                        </CartProvider>
                    </UserProvider>
                </BookSortByProvider>
            </BookAdvancedFilteringProvider>
        </AppRouterCacheProvider>
    );
};
