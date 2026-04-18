import { userReducer } from '@/providers/user/UserReducer';
import { INITIAL_USER_STATE } from '@/providers/user/UserContext';
import { mapUserData } from '@/providers/user/utils/UserMapper';

jest.mock('@/providers/user/utils/UserMapper', () => ({
    mapUserData: jest.fn((user) => user),
}));

describe('UserReducer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('START_LOADING', () => {
        it('should set loading to true', () => {
            const state = { ...INITIAL_USER_STATE, loading: false };
            const action = { type: 'START_LOADING' as const };

            const newState = userReducer(state, action);

            expect(newState.loading).toBe(true);
        });
    });

    describe('STOP_LOADING', () => {
        it('should set loading to false', () => {
            const state = { ...INITIAL_USER_STATE, loading: true };
            const action = { type: 'STOP_LOADING' as const };

            const newState = userReducer(state, action);

            expect(newState.loading).toBe(false);
        });
    });

    describe('SET_SYNCED_DATA', () => {
        it('should update user data and set loggedIn to true', () => {
            const state = { ...INITIAL_USER_STATE, loggedIn: false };
            const action = {
                type: 'SET_SYNCED_DATA' as const,
                payload: {
                    user: { id: 'user-123', username: 'testuser' },
                    profileExists: true,
                    wishlist: [{ book_id: 'book-1' }],
                },
            };

            const newState = userReducer(state, action);

            expect(newState.loggedIn).toBe(true);
            expect(newState.loading).toBe(false);
            expect(newState.error).toBeNull();
            expect(newState.profileExists).toBe(true);
            expect(newState.wishlist).toEqual([{ book_id: 'book-1' }]);
            expect(mapUserData).toHaveBeenCalledWith({ id: 'user-123', username: 'testuser' });
        });
    });

    describe('UPDATE_PROFILE', () => {
        it('should update user and profileExists', () => {
            const state = { ...INITIAL_USER_STATE };
            const action = {
                type: 'UPDATE_PROFILE' as const,
                payload: {
                    user: { id: 'user-123', username: 'newuser' },
                    profileExists: true,
                },
            };

            const newState = userReducer(state, action);

            expect(newState.profileExists).toBe(true);
            expect(mapUserData).toHaveBeenCalledWith({ id: 'user-123', username: 'newuser' });
        });
    });

    describe('UPDATE_WISHLIST', () => {
        it('should update wishlist', () => {
            const state = { ...INITIAL_USER_STATE, wishlist: [] };
            const newWishlist = [{ book_id: 'book-1' }, { book_id: 'book-2' }];
            const action = {
                type: 'UPDATE_WISHLIST' as const,
                payload: newWishlist,
            };

            const newState = userReducer(state, action);

            expect(newState.wishlist).toEqual(newWishlist);
        });
    });

    describe('SET_ERROR', () => {
        it('should set error and stop loading', () => {
            const state = { ...INITIAL_USER_STATE, loading: true, error: null };
            const action = {
                type: 'SET_ERROR' as const,
                payload: 'Test error message',
            };

            const newState = userReducer(state, action);

            expect(newState.error).toBe('Test error message');
            expect(newState.loading).toBe(false);
        });
    });

    describe('RESET', () => {
        it('should reset to initial state with loading false', () => {
            const state = {
                ...INITIAL_USER_STATE,
                loggedIn: true,
                user: { id: 'user-123' } as any,
                profileExists: true,
                wishlist: [{ book_id: 'book-1' }],
                error: 'Some error',
                loading: true,
            };
            const action = { type: 'RESET' as const };

            const newState = userReducer(state, action);

            expect(newState.loggedIn).toBe(false);
            expect(newState.profileExists).toBe(false);
            expect(newState.wishlist).toEqual([]);
            expect(newState.error).toBeNull();
            expect(newState.loading).toBe(false);
        });

        it('should preserve INITIAL_USER_STATE structure', () => {
            const action = { type: 'RESET' as const };

            const newState = userReducer(INITIAL_USER_STATE, action);

            expect(newState).toEqual({
                ...INITIAL_USER_STATE,
                user: { ...INITIAL_USER_STATE.user },
                loading: false,
            });
        });
    });

    describe('default case', () => {
        it('should return state unchanged for unknown action', () => {
            const state = { ...INITIAL_USER_STATE, loggedIn: true };
            const action = { type: 'UNKNOWN_ACTION' as any };

            const newState = userReducer(state, action);

            expect(newState).toEqual(state);
        });
    });
});
