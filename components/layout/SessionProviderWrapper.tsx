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
