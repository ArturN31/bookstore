'use client';

import { CartProvider } from '@/providers/cart/CartProvider';
import { UserProvider } from '@/providers/user/UserProvider';
import { SnackbarProvider } from 'notistack';
import { BookFilterProvider } from './BookFilterProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

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
            <BookFilterProvider>
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
            </BookFilterProvider>
        </AppRouterCacheProvider>
    );
};
