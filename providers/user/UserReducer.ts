import { UserState, UserAction, INITIAL_USER_STATE } from '@/providers/user/UserContext';
import { mapUserData } from '@/providers/user/utils/UserMapper';

export function userReducer(state: UserState, action: UserAction): UserState {
    switch (action.type) {
        case 'START_LOADING':
            return { ...state, loading: true };

        case 'STOP_LOADING':
            return { ...state, loading: false };

        case 'SET_SYNCED_DATA':
            return {
                ...state,
                user: mapUserData(action.payload.user),
                profileExists: action.payload.profileExists,
                wishlist: action.payload.wishlist,
                loggedIn: true,
                loading: false,
                error: null,
            };

        case 'UPDATE_PROFILE':
            return {
                ...state,
                user: mapUserData(action.payload.user),
                profileExists: action.payload.profileExists,
            };

        case 'UPDATE_WISHLIST':
            return { ...state, wishlist: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };

        case 'RESET':
            return {
                ...INITIAL_USER_STATE,
                user: { ...INITIAL_USER_STATE.user },
                loading: false,
            };

        default:
            return state;
    }
}
