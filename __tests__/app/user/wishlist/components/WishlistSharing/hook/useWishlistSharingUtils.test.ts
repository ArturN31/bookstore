import {
    getErrorMessage,
    getShareUrl,
} from '@/app/user/wishlist/components/WishlistSharing/hook/wishlistSharingUtils';

describe('wishlistSharingUtils (Browser)', () => {
    describe('getShareUrl', () => {
        it('should return public URL when isPublic is true and window is defined', () => {
            const url = getShareUrl(true, 'john_doe', 'token-123');
            expect(url).toBe('http://localhost/user/wishlist/shared/john_doe');
        });

        it('should return token URL when isPublic is false and shareToken is present', () => {
            const url = getShareUrl(false, 'john_doe', 'token-123');
            expect(url).toBe('http://localhost/user/wishlist/shared/token/token-123');
        });

        it('should return empty string if public but username is missing', () => {
            const url = getShareUrl(true, '', 'token-123');
            expect(url).toBe('');
        });

        it('should return empty string if private and token is missing', () => {
            const url = getShareUrl(false, 'john_doe', '');
            expect(url).toBe('');
        });
    });

    describe('getErrorMessage', () => {
        it('should return error message when err is an Error instance', () => {
            const err = new Error('Custom error message');
            expect(getErrorMessage(err, 'Fallback')).toBe('Custom error message');
        });

        it('should return string when err is a string', () => {
            expect(getErrorMessage('String error', 'Fallback')).toBe('String error');
        });

        it('should return fallback message when err is neither Error nor string', () => {
            expect(getErrorMessage(404, 'Fallback message')).toBe('Fallback message');
        });
    });
});
