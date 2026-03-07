import { SupabaseClient } from '@supabase/supabase-js';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateMockUsersArray, MockUserSetup } from '@/utils/db/dbSeed/generateUsers';

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

/**
 * Step 0: Atomic Purge
 */
export async function clearDatabase(supabase: SupabaseClient) {
    console.log('Initiating sequential relational purge...');

    for (const table of TABLE_HIERARCHY) await wipeTable(supabase, table);

    const { data: auth } = await supabase.auth.admin.listUsers();
    if (auth?.users?.length) {
        console.log(`Cleaning ${auth.users.length} Auth identities...`);
        await Promise.all(auth.users.map((u) => supabase.auth.admin.deleteUser(u.id)));
    }

    console.log('Public schema and Auth purged.');
}

/**
 * Step 1: Identity Injection
 */
export async function seedIdentities(supabase: SupabaseClient, count: number) {
    console.log(`Seeding ${count} identities...`);

    const mockUsers: MockUserSetup[] = generateMockUsersArray(count);
    const profileBatch: any[] = [];

    for (const mock of mockUsers) {
        const { data, error: authError } = await supabase.auth.admin.createUser({
            email: mock.email,
            password: mock.password,
            email_confirm: true,
            user_metadata: { username: mock.username },
        });

        if (authError) {
            console.error(`Auth Creation Failed [${mock.email}]:`, authError.message);
            throw authError;
        }

        if (data.user)
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
    }

    if (profileBatch.length > 0) {
        const { data: seededProfiles, error: profileError } = await supabase
            .from('users')
            .insert(profileBatch)
            .select();

        if (profileError) throw profileError;
        return seededProfiles;
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

    const [bookRes, discRes] = await Promise.all([
        supabase.from('books').insert(generateBooksArray(bookCount)).select(),
        supabase.from('discounts').insert(generateDiscounts(discountCount)).select(),
    ]);

    if (bookRes.error) throw bookRes.error;
    if (discRes.error) throw discRes.error;

    return { books: bookRes.data as BookDB[], discounts: discRes.data as DiscountDB[] };
}

/**
 * Step 3: Market Activity
 */
export async function seedMarketActivity(
    supabase: SupabaseClient,
    books: BookDB[],
    users: UserDB[],
    discounts: DiscountDB[],
) {
    const activeBooks = books.filter((b) => b.is_active);
    console.log(`Relational Seeding: Using ${activeBooks.length} active books.`);

    const { orders, items, orderDiscounts } = generateOrdersAndItems(
        activeBooks,
        DEV_CONFIG.ORDERS_COUNT,
        DEV_CONFIG.ORDER_ITEM_COUNT,
        discounts,
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

    const { error: ordErr } = await supabase.from('orders').insert(orders);
    if (ordErr) throw ordErr;

    const { data: carts, error: cartErr } = await supabase
        .from('shopping_carts')
        .insert(users.map((u) => ({ user_id: u.id })))
        .select();

    if (cartErr || !carts) throw cartErr;

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

    await Promise.all([
        supabase.from('book_reviews').insert(reviews),
        supabase.from('order_items').insert(items),
        supabase.from('shopping_cart_items').insert(cartItems),
        supabase.from('wishlist').insert(wishlistEntries),
        orderDiscounts.length > 0
            ? supabase.from('order_discounts').insert(orderDiscounts)
            : Promise.resolve(),
    ]);
}

/**
 * MAIN ORCHESTRATOR
 */
export async function runFullDatabaseSeed() {
    const startTime = performance.now();
    const { createAdminClient } = await import('@/utils/db/admin');
    const supabase = await createAdminClient();

    try {
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
    } catch (error: any) {
        console.error('\nSEEDING FAILED');
        console.error('Reason:', JSON.stringify(error, null, 2));
        throw error;
    }
}
