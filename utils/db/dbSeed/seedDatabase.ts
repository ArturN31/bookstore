import { SupabaseClient } from '@supabase/supabase-js';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateMockUsersArray, MockUserSetup } from '@/utils/db/dbSeed/generateUsers';
import { Database } from '@/database.types';

type BookDB = Database['public']['Tables']['books']['Row'];
type DiscountDB = Database['public']['Tables']['discounts']['Row'];
type UserDB = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

const DEV_CONFIG = {
    BOOK_COUNT: 100,
    REVIEW_COUNT: 500,
    USER_COUNT: 15,
    CART_ITEM_COUNT: 50,
    ORDERS_COUNT: 100,
    ORDER_ITEM_COUNT: 300,
    ORDER_DISCOUNT_COUNT: 50,
    DISCOUNT_COUNT: 5,
    WISHLIST_COUNT: 50,
} as const;

/**
 * CONSTANTS: Relational Integrity Order
 */
const TABLE_HIERARCHY = [
    'order_discounts',
    'order_items',
    'shopping_cart_items',
    'book_reviews',
    'wishlist',
    'orders',
    'shopping_carts',
    'discounts',
    'books',
    'users',
] as const;

async function wipeTable(supabase: SupabaseClient, table: string) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`[Wipe Failure] ${table}: ${error.message}`);
}

const deleteAuthIdentities = async (
    supabase: SupabaseClient,
    userIds: string[],
): Promise<string[]> => {
    const results = await Promise.all(
        userIds.map(async (userId) => {
            try {
                const { error } = await supabase.auth.admin.deleteUser(userId);
                return error ? `${userId}: ${error.message}` : null;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return `${userId}: ${message}`;
            }
        }),
    );

    return results.filter((error): error is string => error !== null);
};

/**
 * Step 0: Atomic Purge
 */
export async function clearDatabase(supabase: SupabaseClient) {
    console.log('Initiating sequential relational purge...');
    const clearedTables: string[] = [];

    for (const table of TABLE_HIERARCHY) {
        try {
            await wipeTable(supabase, table);
            clearedTables.push(table);
        } catch (error: unknown) {
            const reason = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(
                `Database reset stopped at ${table}: ${reason}. Already cleared: ${clearedTables.join(', ') || 'none'}.`,
            );
        }
    }

    const { data: auth, error: authError } = await supabase.auth.admin.listUsers();
    if (authError)
        throw new Error(`Auth identity lookup failed during reset: ${authError.message}`);
    if (auth?.users?.length) {
        console.log(`Cleaning ${auth.users.length} Auth identities...`);
        const deletionErrors = await deleteAuthIdentities(
            supabase,
            auth.users.map(({ id }) => id),
        );
        if (deletionErrors.length > 0)
            throw new Error(
                `Auth identity cleanup failed during reset: ${deletionErrors.join('; ')}`,
            );
    }

    console.log('Public schema and Auth purged.');
}

/**
 * Step 1: Identity Injection
 */
export async function seedIdentities(
    supabase: SupabaseClient,
    count: number,
): Promise<readonly UserDB[]> {
    console.log(`Seeding ${count} identities...`);

    const mockUsers: readonly MockUserSetup[] = generateMockUsersArray(count);
    const profileBatch: UserInsert[] = [];
    const createdAuthIds: string[] = [];

    for (const mock of mockUsers) {
        const { data, error: authError } = await supabase.auth.admin.createUser({
            email: mock.email,
            password: mock.password,
            email_confirm: true,
            user_metadata: { username: mock.username },
        });

        if (data.user) createdAuthIds.push(data.user.id);
        if (authError) {
            const cleanupErrors = await deleteAuthIdentities(supabase, createdAuthIds);
            const cleanupStatus = cleanupErrors.length
                ? ` Cleanup failed for: ${cleanupErrors.join('; ')}.`
                : ' Previously created Auth identities were removed.';
            throw new Error(
                `Auth identity creation failed for ${mock.email}: ${authError.message}.${cleanupStatus}`,
            );
        }

        if (!data.user) {
            const cleanupErrors = await deleteAuthIdentities(supabase, createdAuthIds);
            const cleanupStatus = cleanupErrors.length
                ? ` Cleanup failed for: ${cleanupErrors.join('; ')}.`
                : ' Previously created Auth identities were removed.';
            throw new Error(
                `Auth identity creation returned no user for ${mock.email}.${cleanupStatus}`,
            );
        }

        profileBatch.push({
            id: data.user.id,
            first_name: mock.first_name,
            last_name: mock.last_name,
            date_of_birth: mock.date_of_birth,
            street_address: mock.street_address,
            postcode: mock.postcode,
            city: mock.city,
            country: mock.country,
            phone_number: mock.phone_number,
            username: mock.username,
            is_wishlist_public: mock.is_wishlist_public,
            wishlist_share_token: mock.wishlist_share_token,
            are_reviews_public: mock.are_reviews_public,
            is_profile_public: mock.is_profile_public,
            stripe_customer_id: mock.stripe_customer_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
    }

    if (profileBatch.length > 0) {
        const { data: seededProfiles, error: profileError } = await supabase
            .from('users')
            .insert(profileBatch)
            .select();

        if (profileError || !seededProfiles || seededProfiles.length !== profileBatch.length) {
            const cleanupErrors = await deleteAuthIdentities(supabase, createdAuthIds);
            const cleanupStatus = cleanupErrors.length
                ? ` Auth cleanup failed for: ${cleanupErrors.join('; ')}.`
                : ' Created Auth identities were removed.';
            const cause = profileError?.message ?? 'Profile insert returned an incomplete batch';
            throw new Error(
                `User profile stage failed after creating ${createdAuthIds.length} Auth identities: ${cause}.${cleanupStatus}`,
            );
        }
        return seededProfiles as UserDB[];
    }

    return [];
}

/**
 * Step 2: Catalog Seeding
 */
export async function seedCatalog(
    supabase: SupabaseClient,
    bookCount: number,
    discountCount: number,
) {
    console.log('Seeding catalog and discounts...');

    const booksToSeed = generateBooksArray(bookCount);
    const discountsToSeed = generateDiscounts(discountCount);

    const bookRes = await supabase.from('books').insert(booksToSeed).select();
    if (bookRes.error) throw new Error(`Catalog books stage failed: ${bookRes.error.message}`);
    if (bookRes.data?.length !== booksToSeed.length)
        throw new Error(
            `Catalog books stage returned ${bookRes.data?.length ?? 0} of ${booksToSeed.length} rows.`,
        );

    const discRes = await supabase.from('discounts').insert(discountsToSeed).select();
    if (discRes.error)
        throw new Error(
            `Catalog discounts stage failed after ${bookRes.data.length} books were inserted: ${discRes.error.message}`,
        );
    if (discRes.data?.length !== discountsToSeed.length)
        throw new Error(
            `Catalog discounts stage returned ${discRes.data?.length ?? 0} of ${discountsToSeed.length} rows after ${bookRes.data.length} books were inserted.`,
        );

    return {
        books: bookRes.data as BookDB[],
        discounts: discRes.data as DiscountDB[],
    };
}

/**
 * Step 3: Market Activity
 */
export async function seedMarketActivity(
    supabase: SupabaseClient,
    books: readonly BookDB[],
    users: readonly UserDB[],
    discounts: readonly DiscountDB[],
) {
    const activeBooks = books.filter((b) => b.is_active);
    console.log(`Relational Seeding: Using ${activeBooks.length} active books.`);

    const { orders, items, orderDiscounts } = generateOrdersAndItems(
        activeBooks,
        users,
        DEV_CONFIG.ORDERS_COUNT,
        DEV_CONFIG.ORDER_ITEM_COUNT,
        discounts as DiscountDB[],
        DEV_CONFIG.ORDER_DISCOUNT_COUNT,
    );

    const reviews = generateReviewsArray(
        activeBooks,
        DEV_CONFIG.REVIEW_COUNT,
        users.map((u) => ({ id: u.id, username: u.username })),
    );

    const wishlistEntries = users
        .flatMap((u) => activeBooks.slice(0, 5).map((b) => ({ user_id: u.id, book_id: b.id })))
        .sort(() => 0.5 - Math.random())
        .slice(0, DEV_CONFIG.WISHLIST_COUNT);

    const completedStages: string[] = [];
    const recordStage = async (
        stage: string,
        query: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
        expectedCount: number,
    ) => {
        const { data, error } = await query;
        if (error)
            throw new Error(
                `Market activity ${stage} stage failed: ${error.message}. Completed stages: ${completedStages.join(', ') || 'none'}.`,
            );
        if (!data || data.length !== expectedCount)
            throw new Error(
                `Market activity ${stage} stage returned ${data?.length ?? 0} of ${expectedCount} rows. Completed stages: ${completedStages.join(', ') || 'none'}.`,
            );
        completedStages.push(stage);
        return data;
    };

    await recordStage('orders', supabase.from('orders').insert(orders).select(), orders.length);

    const { data: carts, error: cartErr } = await supabase
        .from('shopping_carts')
        .insert(users.map((u) => ({ user_id: u.id })))
        .select();

    if (cartErr)
        throw new Error(
            `Market activity shopping carts stage failed: ${cartErr.message}. Completed stages: ${completedStages.join(', ')}.`,
        );
    if (!carts || carts.length !== users.length)
        throw new Error(
            `Market activity shopping carts stage returned ${carts?.length ?? 0} of ${users.length} rows. Completed stages: ${completedStages.join(', ')}.`,
        );
    completedStages.push('shopping carts');

    const cartItems = carts
        .flatMap((cart) =>
            activeBooks.slice(0, 5).map((book) => ({
                cart_id: cart.id,
                book_id: book.id,
                quantity: 1,
            })),
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, DEV_CONFIG.CART_ITEM_COUNT);

    await recordStage(
        'book reviews',
        supabase.from('book_reviews').insert(reviews).select(),
        reviews.length,
    );
    await recordStage(
        'order items',
        supabase.from('order_items').insert(items).select(),
        items.length,
    );
    await recordStage(
        'shopping cart items',
        supabase.from('shopping_cart_items').insert(cartItems).select(),
        cartItems.length,
    );
    await recordStage(
        'wishlist entries',
        supabase.from('wishlist').insert(wishlistEntries).select(),
        wishlistEntries.length,
    );
    if (orderDiscounts.length > 0)
        await recordStage(
            'order discounts',
            supabase.from('order_discounts').insert(orderDiscounts).select(),
            orderDiscounts.length,
        );
}

/**
 * MAIN ORCHESTRATOR
 */
export async function runFullDatabaseSeed(authorizeWrite: () => Promise<void>) {
    const startTime = performance.now();
    const { createAdminClient } = await import('@/utils/db/admin');
    const supabase = await createAdminClient();

    try {
        await authorizeWrite();
        await clearDatabase(supabase);

        const seededUsers = await seedIdentities(supabase, DEV_CONFIG.USER_COUNT);
        const { books, discounts } = await seedCatalog(
            supabase,
            DEV_CONFIG.BOOK_COUNT,
            DEV_CONFIG.DISCOUNT_COUNT,
        );

        const activeBooks = books.filter((book) => book.is_active);

        await seedMarketActivity(supabase, activeBooks, seededUsers, discounts);

        const duration = ((performance.now() - startTime) / 1000).toFixed(3);
        console.log(`Reset Complete. Total_Seed_Duration: ${duration}s`);

        return { success: true };
    } catch (error: unknown) {
        console.error('\nSEEDING FAILED');
        console.error('Reason:', JSON.stringify(error, null, 2));
        throw error;
    }
}
