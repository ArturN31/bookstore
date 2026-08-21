/**
 * @jest-environment node
 */
import { getShareUrl } from '@/app/user/wishlist/components/WishlistSharing/hook/wishlistSharingUtils';

describe('wishlistSharingUtils (SSR)', () => {
    it('should return public URL without origin when window is undefined', () => {
        const url = getShareUrl(true, 'john_doe', 'token-123');
        expect(url).toBe('/user/wishlist/shared/john_doe');
    });

    it('should return token URL without origin when window is undefined', () => {
        const url = getShareUrl(false, 'john_doe', 'token-123');
        expect(url).toBe('/user/wishlist/shared/token/token-123');
    });
});
