import { DEFAULT_USER, INITIAL_USER_STATE, PartialUserPayload, UserState } from '../UserContext';

/**
 * Transforms a PartialUserPayload (from API or Auth) into a guaranteed full User object.
 */
export const mapUserData = (incoming: PartialUserPayload): User => {
    return {
        ...DEFAULT_USER,
        ...incoming,
        created_at: incoming.created_at ? incoming.created_at : DEFAULT_USER.created_at,
        updated_at: incoming.updated_at ? incoming.updated_at : DEFAULT_USER.updated_at,
    };
};

/**
 * Creates the starting state for the useReducer.
 */
export const createInitialState = (
    initialUser: User | null,
    initialWishlist: Wishlist[] | null,
): UserState => {
    const hasProfileRow = !!initialUser && !!initialUser.first_name;

    return {
        ...INITIAL_USER_STATE,
        loggedIn: !!initialUser,
        profileExists: hasProfileRow,
        user: initialUser ? mapUserData(initialUser) : DEFAULT_USER,
        wishlist: initialWishlist ? initialWishlist : [],
    };
};
