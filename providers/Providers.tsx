'use client';

import { CartProvider } from './cart/CartProvider';
import { UserProvider } from './user/UserProvider';
import { SnackbarProvider } from 'notistack';

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
        <UserProvider
            initialUser={data.initialUser}
            initialWishlist={data.initialWishlist}
        >
            <CartProvider initialCart={data.initialCart}>
                <SnackbarProvider
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                >
                    {children}
                </SnackbarProvider>
            </CartProvider>
        </UserProvider>
    );
};
