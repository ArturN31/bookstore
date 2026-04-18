import { mapUserData, createInitialState } from '@/providers/user/utils/UserMapper';
import { DEFAULT_USER, INITIAL_USER_STATE } from '@/providers/user/UserContext';

describe('UserMapper', () => {
    describe('mapUserData', () => {
        it('should return DEFAULT_USER for empty object', () => {
            const result = mapUserData({});

            expect(result).toEqual(DEFAULT_USER);
        });

        it('should merge incoming data with DEFAULT_USER', () => {
            const incoming = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@test.com',
            };

            const result = mapUserData(incoming);

            expect(result.id).toBe('user-123');
            expect(result.username).toBe('testuser');
            expect(result.email).toBe('test@test.com');
        });

        it('should use incoming created_at when provided', () => {
            const incoming = {
                id: 'user-123',
                created_at: '2024-01-01',
            };

            const result = mapUserData(incoming);

            expect(result.created_at).toBe('2024-01-01');
        });

        it('should use DEFAULT_USER created_at when incoming is empty string', () => {
            const incoming = {
                id: 'user-123',
                created_at: '',
            };

            const result = mapUserData(incoming);

            expect(result.created_at).toBe(DEFAULT_USER.created_at);
        });

        it('should use incoming updated_at when provided', () => {
            const incoming = {
                id: 'user-123',
                updated_at: '2024-01-02',
            };

            const result = mapUserData(incoming);

            expect(result.updated_at).toBe('2024-01-02');
        });

        it('should use DEFAULT_USER updated_at when incoming is null', () => {
            const incoming = {
                id: 'user-123',
                updated_at: null,
            };

            const result = mapUserData(incoming);

            expect(result.updated_at).toBe(DEFAULT_USER.updated_at);
        });
    });

    describe('createInitialState', () => {
        it('should return INITIAL_USER_STATE when initialUser is null', () => {
            const result = createInitialState(null, null);

            expect(result.loggedIn).toBe(false);
            expect(result.profileExists).toBe(false);
            expect(result.user).toEqual(DEFAULT_USER);
            expect(result.wishlist).toEqual([]);
        });

        it('should set loggedIn to true when initialUser exists', () => {
            const initialUser = { id: 'user-123' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.loggedIn).toBe(true);
        });

        it('should set profileExists to true when user has first_name', () => {
            const initialUser = { id: 'user-123', first_name: 'John' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.profileExists).toBe(true);
        });

        it('should set profileExists to false when user has no first_name', () => {
            const initialUser = { id: 'user-123', first_name: '' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.profileExists).toBe(false);
        });

        it('should map initialUser using mapUserData', () => {
            const initialUser = { id: 'user-123', username: 'testuser' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.user.id).toBe('user-123');
            expect(result.user.username).toBe('testuser');
        });

        it('should use initialWishlist when provided', () => {
            const initialUser = { id: 'user-123' } as User;
            const initialWishlist = [{ book_id: 'book-1' }];
            const result = createInitialState(initialUser, initialWishlist);

            expect(result.wishlist).toEqual(initialWishlist);
        });

        it('should use empty array when initialWishlist is null', () => {
            const initialUser = { id: 'user-123' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.wishlist).toEqual([]);
        });

        it('should use empty array when initialWishlist is undefined', () => {
            const initialUser = { id: 'user-123' } as User;
            const result = createInitialState(initialUser, undefined as any);

            expect(result.wishlist).toEqual([]);
        });

        it('should set loading to false', () => {
            const initialUser = { id: 'user-123' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.loading).toBe(false);
        });

        it('should set error to null', () => {
            const initialUser = { id: 'user-123' } as User;
            const result = createInitialState(initialUser, null);

            expect(result.error).toBeNull();
        });
    });
});
