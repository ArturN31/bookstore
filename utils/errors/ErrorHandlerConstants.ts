export const APP_ERROR_MESSAGES = {
    INVALID_USER_SESSION: 'User session is invalid.',
    MALFORMED_IDENTIFIER: 'Malformed identifier parameters.',
    INVALID_QUANTITY: 'Invalid quantity assignment.',
    UNAUTHORIZED_ACCESS: 'Unauthorized access token',
    UNAUTHENTICATED_USER: 'Unauthenticated user context',
    NO_DATA_RETURNED: 'No data returned.',
    FAILED_TO_CREATE_CART: 'Failed to create cart.',
    SESSION_IDENTIFICATION_FAILED: 'Session identification failed.',
    UNSUPPORTED_ACTION_TYPE: 'Unsupported action type.',
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
    VALIDATION_ERROR: 'Please correct the highlighted errors.',
    SESSION_EXPIRED: 'Session expired. Please log in again.',
    SAVE_ADDRESS_ERROR: 'Failed to save address details.',
    USERNAME_VALIDATION_ERROR: 'Please resolve the validation errors.',
    CURRENT_USERNAME: 'This is already your current username.',
    USERNAME_TAKEN: 'This username is already taken.',
    USERNAME_EXISTS_DB_ERROR: 'This record already exists. Please use a different value.',
    INVALID_WISHLIST_REQUEST: 'Invalid wishlist request.',
    WISHLIST_LOGIN_REQUIRED: 'Login required to manage wishlist.',
    UNSUPPORTED_WISHLIST_ACTION: 'Unsupported wishlist action.',
} as const;

export const DB_ERROR_MAP: Record<string, string> = {
    '23505': 'This record already exists. Please use a different value.',
    '23503': 'The requested operation cannot be completed because related data is missing.',
    '23502': 'Please fill in all required fields.',
    '42P01': 'We encountered an issue processing your request. Please contact support.',
    '42703': 'We encountered an issue processing your request. Please contact support.',
    PGRST116: 'Could not find the exact record requested.',
    '22P02': 'The provided information is incorrectly formatted.',
} as const;

export const AUTH_STATUS_MAP: Record<number, string> = {
    400: 'Invalid credentials or request. Please check your information and try again.',
    401: 'You are not authorized to perform this action. Please log in.',
    403: 'Access to this resource is forbidden.',
    422: 'The provided authentication information is invalid.',
    429: 'Too many requests. Please wait a moment before trying again.',
} as const;

export const AUTH_CODE_MAP: Record<string, string> = {
    reauthentication_needed:
        'Security timeout: Please sign out and back in to change your password.',
    weak_password: 'The new password does not meet security requirements.',
} as const;
