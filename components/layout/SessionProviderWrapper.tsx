'use server';

import { getCartData } from '@/data/cart/GetCartData';
import { getUserData, getUserWishlist } from '@/data/user/GetUserData';
import { mapCartData } from '@/providers/cart/utils/CartMapper';
import { Providers } from '@/providers/Providers';
import { DEFAULT_USER } from '@/providers/user/UserContext';
import { mapUserData } from '@/providers/user/utils/UserMapper';
import { createBackendClient } from '@/utils/db/server';

export const SessionProviderWrapper = async ({ children }: { children: React.ReactNode }) => {
    const supabase = await createBackendClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let initialUser: User | null = null;
    let initialWishlist: Wishlist[] = [];
    let initialCart: Cart | null = null;

    if (user) {
        const [userData, wishlistData, cartData] = await Promise.all([
            getUserData(supabase),
            getUserWishlist(supabase, user.id),
            getCartData(supabase, user.id),
        ]);

        initialUser = userData ? mapUserData(userData) : { ...DEFAULT_USER, id: user.id };
        initialWishlist = wishlistData || [];
        if (!cartData.error && cartData.books) initialCart = mapCartData(cartData.books);
    }

    const initialSessionData = {
        initialUser,
        initialWishlist,
        initialCart,
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
