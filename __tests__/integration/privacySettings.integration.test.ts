import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { Database } from '@/database.types';

const integrationUrl = process.env.SUPABASE_INTEGRATION_URL;
const integrationAnonKey = process.env.SUPABASE_INTEGRATION_ANON_KEY;
const integrationServiceKey = process.env.SUPABASE_INTEGRATION_SERVICE_KEY;
const isConfigured = Boolean(integrationUrl && integrationAnonKey && integrationServiceKey);

const integrationDescribe = isConfigured ? describe : describe.skip;

integrationDescribe('Privacy settings database integration', () => {
    let admin: SupabaseClient<Database>;
    let anonymous: SupabaseClient<Database>;
    let getPublicProfile: typeof import('@/data/user/profile/PrivacySettingsService').getPublicProfile;
    let getPublicWishlistByUsername: typeof import('@/data/user/wishlist/sharing/WishlistShareService').getPublicWishlistByUsername;
    let getWishlistByShareToken: typeof import('@/data/user/wishlist/sharing/WishlistShareService').getWishlistByShareToken;
    let updateUserPrivacySettings: typeof import('@/data/user/profile/PrivacySettingsService').updateUserPrivacySettings;

    const userId = randomUUID();
    const bookId = randomUUID();
    const profileToken = randomUUID();
    const username = `privacy_${userId.replaceAll('-', '').slice(0, 20)}`;
    const email = `${username}@example.test`;
    let authUserCreated = false;

    const assertNoError = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
    };

    beforeAll(async () => {
        if (!integrationUrl || !integrationAnonKey || !integrationServiceKey)
            throw new Error('Supabase integration test configuration is incomplete.');

        const hostname = new URL(integrationUrl).hostname;
        if (!['localhost', '127.0.0.1', '::1'].includes(hostname))
            throw new Error('Privacy integration tests only run against a local Supabase URL.');

        process.env.NEXT_PUBLIC_SUPABASE_DB_URL = integrationUrl;
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = integrationAnonKey;
        process.env.SUPABASE_SECRET_KEY = integrationServiceKey;

        admin = createClient<Database>(integrationUrl, integrationServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        anonymous = createClient<Database>(integrationUrl, integrationAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const privacyService = await import('@/data/user/profile/PrivacySettingsService');
        const wishlistService = await import('@/data/user/wishlist/sharing/WishlistShareService');
        getPublicProfile = privacyService.getPublicProfile;
        updateUserPrivacySettings = privacyService.updateUserPrivacySettings;
        getPublicWishlistByUsername = wishlistService.getPublicWishlistByUsername;
        getWishlistByShareToken = wishlistService.getWishlistByShareToken;

        const { error: authError } = await admin.auth.admin.createUser({
            id: userId,
            email,
            password: randomUUID(),
            email_confirm: true,
        });
        assertNoError(authError);
        authUserCreated = true;

        const { error: profileError } = await admin.from('users').insert({
            id: userId,
            first_name: 'Privacy',
            last_name: 'Test',
            date_of_birth: '2000-01-01',
            street_address: '1 Test Street',
            postcode: '00000',
            city: 'Test City',
            country: 'Test Country',
            phone_number: '0000000000',
            username,
            is_profile_public: false,
            is_wishlist_public: false,
            are_reviews_public: false,
            wishlist_share_token: profileToken,
        });
        assertNoError(profileError);

        const { error: bookError } = await admin.from('books').insert({
            id: bookId,
            title: 'Privacy Integration Test Book',
            author: 'Test Author',
            genre: 'Test',
            publisher: 'Test Publisher',
            publication_date: '2020-01-01',
            price: '10.00',
            description: 'Integration test fixture',
            format: 'Paperback',
            page_count: 100,
            image_url: '',
            stock_quantity: 1,
            is_active: true,
        });
        assertNoError(bookError);

        const { error: reviewError } = await admin.from('book_reviews').insert({
            book_id: bookId,
            user_id: userId,
            username,
            rating: 5,
            review: 'Privacy integration test review',
        });
        assertNoError(reviewError);

        const { error: wishlistError } = await admin.from('wishlist').insert({
            user_id: userId,
            book_id: bookId,
        });
        assertNoError(wishlistError);
    });

    beforeEach(async () => {
        const { error } = await admin
            .from('users')
            .update({
                is_profile_public: false,
                is_wishlist_public: false,
                are_reviews_public: false,
                wishlist_share_token: profileToken,
            })
            .eq('id', userId);
        assertNoError(error);
    });

    afterAll(async () => {
        if (!admin) return;

        const { error: reviewsError } = await admin
            .from('book_reviews')
            .delete()
            .eq('user_id', userId);
        assertNoError(reviewsError);

        const { error: wishlistError } = await admin
            .from('wishlist')
            .delete()
            .eq('user_id', userId);
        assertNoError(wishlistError);

        const { error: profileError } = await admin.from('users').delete().eq('id', userId);
        assertNoError(profileError);

        const { error: bookError } = await admin.from('books').delete().eq('id', bookId);
        assertNoError(bookError);

        if (authUserCreated) {
            const { error } = await admin.auth.admin.deleteUser(userId);
            assertNoError(error);
        }
    });

    it('reflects profile visibility settings while keeping the profile RPC unavailable to anon', async () => {
        const privateProfile = await getPublicProfile(username);
        expect(privateProfile.error).toBeNull();
        expect(privateProfile.data?.is_profile_public).toBe(false);

        const { data: hiddenProfiles, error: profileQueryError } = await anonymous
            .from('users')
            .select('username')
            .eq('username', username);
        assertNoError(profileQueryError);
        expect(hiddenProfiles).toEqual([]);

        const { data: rpcData, error: rpcError } = await anonymous.rpc('get_public_profile', {
            target_username: username,
        });
        expect(rpcError).not.toBeNull();
        expect(rpcData).toBeNull();

        const { error: updateError } = await admin
            .from('users')
            .update({ is_profile_public: true })
            .eq('id', userId);
        assertNoError(updateError);

        const publicProfile = await getPublicProfile(username);
        expect(publicProfile.error).toBeNull();
        expect(publicProfile.data?.is_profile_public).toBe(true);
    });

    it('exposes reviews only while the review visibility setting is enabled', async () => {
        const { data: privateReviews, error: privateError } = await anonymous
            .from('book_reviews')
            .select('id')
            .eq('user_id', userId);
        assertNoError(privateError);
        expect(privateReviews).toEqual([]);

        const { error: updateError } = await admin
            .from('users')
            .update({ are_reviews_public: true })
            .eq('id', userId);
        assertNoError(updateError);

        const { data: publicReviews, error: publicError } = await anonymous
            .from('book_reviews')
            .select('id, username, rating, review')
            .eq('user_id', userId);
        assertNoError(publicError);
        expect(publicReviews).toHaveLength(1);
        expect(publicReviews?.[0]).toMatchObject({
            username,
            rating: 5,
            review: 'Privacy integration test review',
        });
        expect(publicReviews?.[0]).not.toHaveProperty('user_id');
    });

    it('serves a public wishlist only when wishlist visibility is enabled', async () => {
        const privateWishlist = await getPublicWishlistByUsername(username);
        expect(privateWishlist.error).toBeNull();
        expect(privateWishlist.data).toBeNull();

        const { error: updateError } = await admin
            .from('users')
            .update({ is_wishlist_public: true })
            .eq('id', userId);
        assertNoError(updateError);

        const publicWishlist = await getPublicWishlistByUsername(username);
        expect(publicWishlist.error).toBeNull();
        expect(publicWishlist.data).toMatchObject({
            username,
            wishlist: [{ books: { id: bookId, title: 'Privacy Integration Test Book' } }],
        });
        expect(publicWishlist.data).not.toHaveProperty('user_id');
        expect(publicWishlist.data).not.toHaveProperty('first_name');
        expect(publicWishlist.data).not.toHaveProperty('last_name');
        expect(publicWishlist.data).not.toHaveProperty('wishlist_share_token');
        expect(publicWishlist.data?.wishlist[0]).not.toHaveProperty('id');
        expect(publicWishlist.data?.wishlist[0]).not.toHaveProperty('created_at');
        expect(publicWishlist.data?.wishlist[0]).not.toHaveProperty('book_id');
    });

    it('revokes the private wishlist token when switching to public sharing', async () => {
        const privateWishlist = await getWishlistByShareToken(profileToken);
        expect(privateWishlist.error).toBeNull();
        expect(privateWishlist.data?.username).toBe(username);

        const { error } = await updateUserPrivacySettings(
            userId,
            { is_wishlist_public: true },
            admin,
        );
        expect(error).toBeNull();

        const revokedWishlist = await getWishlistByShareToken(profileToken);
        expect(revokedWishlist.error).toBeNull();
        expect(revokedWishlist.data).toBeNull();

        const { data: settings, error: settingsError } = await admin
            .from('users')
            .select('is_wishlist_public, wishlist_share_token')
            .eq('id', userId)
            .single();
        assertNoError(settingsError);
        expect(settings).toMatchObject({
            is_wishlist_public: true,
            wishlist_share_token: null,
        });
    });
});
