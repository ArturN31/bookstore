export const UserConstants = {
    MAX_RETRY_ATTEMPTS: 3,
    BASE_RETRY_DELAY: 1000,
    ERROR_SUPABASE_FAILED: 'Supabase client is undefined.',
    ERROR_DATABASE_QUERY_FAILED: 'Database query failed.',
    ERROR_SYSTEM_ERROR: 'A system error occurred or connection timed out.',
    ERROR_AUTH_FAILED: 'User session not found.',
    ERROR_PROFILE_NOT_FOUND: 'User profile not found.',
    ERROR_PROFILE_FETCH_FAILED: 'Failed to retrieve profile data.',
    ERROR_WISHLIST_FETCH_FAILED: 'Could not load wishlist.',
    ERROR_WISHLIST_SYSTEM_ERROR: 'Failed to fetch wishlist due to network issues.',
    ERROR_WISHLIST_NOT_FOUND: 'Wishlist not found.',
    ERROR_MISSING_USER_ID: 'No user ID provided.',
    ERROR_EMAIL_NOT_FOUND: 'Email not found.',
};

export const UserServiceLogPrefix = '[UserService]';

export const UserRepositoryLogPrefix = '[UserRepository]';
