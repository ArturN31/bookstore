/**
 * @jest-environment node
 */

import {
    buildWishlistShareUrl,
    getNextRegeneratedTokenSettings,
    getNextToggleSettings,
} from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/usePrivacySettingsModalUtils';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';

describe('privacySettingsUtils', () => {
    const mockSettings: UserPrivacySettingsDto = {
        is_profile_public: true,
        is_wishlist_public: false,
        are_reviews_public: true,
        wishlist_share_token: 'token-abc-123',
    };

    describe('buildWishlistShareUrl', () => {
        afterEach(() => {
            delete (global as { window?: unknown }).window;
        });

        it('returns empty string if token is null or empty', () => {
            expect(buildWishlistShareUrl(null)).toBe('');
            expect(buildWishlistShareUrl('')).toBe('');
        });

        it('returns path without origin when window is undefined (SSR environment)', () => {
            expect(buildWishlistShareUrl('my-token')).toBe('/user/wishlist/shared?token=my-token');
        });

        it('returns complete url with origin when window is defined', () => {
            (global as { window?: unknown }).window = {
                location: { origin: 'http://localhost:3000' },
            };

            const token = 'my-token';
            const url = buildWishlistShareUrl(token);

            expect(url).toBe(`http://localhost:3000/user/wishlist/shared?token=${token}`);
        });
    });

    describe('getNextToggleSettings', () => {
        it('toggles is_profile_public without mutating wishlist token', () => {
            const { nextSettings, newValue } = getNextToggleSettings(
                mockSettings,
                'is_profile_public',
            );

            expect(newValue).toBe(false);
            expect(nextSettings).toEqual({
                ...mockSettings,
                is_profile_public: false,
            });
        });

        it('toggles are_reviews_public without mutating wishlist token', () => {
            const { nextSettings, newValue } = getNextToggleSettings(
                mockSettings,
                'are_reviews_public',
            );

            expect(newValue).toBe(false);
            expect(nextSettings).toEqual({
                ...mockSettings,
                are_reviews_public: false,
            });
        });

        it('clears wishlist_share_token to null when turning is_wishlist_public to true', () => {
            const { nextSettings, newValue } = getNextToggleSettings(
                mockSettings,
                'is_wishlist_public',
            );

            expect(newValue).toBe(true);
            expect(nextSettings.is_wishlist_public).toBe(true);
            expect(nextSettings.wishlist_share_token).toBeNull();
        });

        it('preserves existing wishlist_share_token when turning is_wishlist_public to false', () => {
            const publicWishlistSettings: UserPrivacySettingsDto = {
                ...mockSettings,
                is_wishlist_public: true,
            };

            const { nextSettings, newValue } = getNextToggleSettings(
                publicWishlistSettings,
                'is_wishlist_public',
            );

            expect(newValue).toBe(false);
            expect(nextSettings.is_wishlist_public).toBe(false);
            expect(nextSettings.wishlist_share_token).toBe('token-abc-123');
        });
    });

    describe('getNextRegeneratedTokenSettings', () => {
        it('sets is_wishlist_public to false and updates wishlist_share_token with new token', () => {
            const publicWishlistSettings: UserPrivacySettingsDto = {
                ...mockSettings,
                is_wishlist_public: true,
            };

            const result = getNextRegeneratedTokenSettings(publicWishlistSettings, 'new-token-999');

            expect(result).toEqual({
                ...publicWishlistSettings,
                is_wishlist_public: false,
                wishlist_share_token: 'new-token-999',
            });
        });
    });
});
