import {
    PRIVACY_REVALIDATION_ROUTES,
    PRIVACY_SETTINGS_ACTIONS,
} from '@/data/user/profile/PrivacySettingsConstants';

describe('PrivacySettingsConstants', () => {
    describe('PRIVACY_SETTINGS_ACTIONS', () => {
        it('has correct action constant values', () => {
            expect(PRIVACY_SETTINGS_ACTIONS.UPDATE_PRIVACY_SETTINGS).toBe(
                'UPDATE_PRIVACY_SETTINGS',
            );
            expect(PRIVACY_SETTINGS_ACTIONS.REGENERATE_WISHLIST_SHARE_TOKEN).toBe(
                'REGENERATE_WISHLIST_SHARE_TOKEN',
            );
        });
    });

    describe('PRIVACY_REVALIDATION_ROUTES', () => {
        const username = 'testuser';

        it('generates correct profile route', () => {
            expect(PRIVACY_REVALIDATION_ROUTES.PROFILE(username)).toBe('/user/profile/testuser');
        });

        it('generates correct public profile route', () => {
            expect(PRIVACY_REVALIDATION_ROUTES.PUBLIC_PROFILE(username)).toBe(
                '/user/profile/public/testuser',
            );
        });

        it('generates correct wishlist route', () => {
            expect(PRIVACY_REVALIDATION_ROUTES.WISHLIST(username)).toBe('/user/wishlist/testuser');
        });

        it('generates correct reviews route', () => {
            expect(PRIVACY_REVALIDATION_ROUTES.REVIEWS(username)).toBe('/user/reviews/testuser');
        });
    });
});
