export const APP_ERROR_MESSAGES = {
    // ==========================================
    // Authentication & Session Errors
    // ==========================================
    INVALID_USER_SESSION: 'User session is invalid.',
    UNAUTHORIZED_ACCESS: 'Unauthorized access token',
    UNAUTHENTICATED_USER: 'Unauthenticated user context',
    SESSION_IDENTIFICATION_FAILED: 'Session identification failed.',
    ERROR_AUTH_FAILED: 'User session not found.',
    SESSION_EXPIRED: 'Session expired. Please log in again.',
    ERROR_MISSING_USER_ID: 'No user ID provided.',
    ERROR_EMAIL_NOT_FOUND: 'Email not found.',

    // ==========================================
    // System, Database & General Validation Errors
    // ==========================================
    MALFORMED_IDENTIFIER: 'Malformed identifier parameters.',
    NO_DATA_RETURNED: 'No data returned.',
    UNSUPPORTED_ACTION_TYPE: 'Unsupported action type.',
    ERROR_SUPABASE_FAILED: 'Supabase client is undefined.',
    ERROR_DATABASE_QUERY_FAILED: 'Database query failed.',
    ERROR_SYSTEM_ERROR: 'A system error occurred or connection timed out.',
    VALIDATION_ERROR: 'Please correct the highlighted errors.',

    // ==========================================
    // Profile & User Management Errors
    // ==========================================
    ERROR_PROFILE_NOT_FOUND: 'User profile not found.',
    ERROR_PROFILE_FETCH_FAILED: 'Failed to retrieve profile data.',
    SAVE_PROFILE_ERROR: 'Failed to save profile details.',
    USERNAME_VALIDATION_ERROR: 'Please resolve the validation errors.',
    USERNAME_TAKEN: 'This username is already taken.',
    USERNAME_EXISTS_DB_ERROR: 'This record already exists. Please use a different value.',
    INVALID_USERNAME_FORMAT:
        'The username contains invalid characters. Only alphanumeric characters, underscores, and hyphens are allowed.',

    // ==========================================
    // Privacy Settings Errors
    // ==========================================
    ERROR_PRIVACY_SETTINGS_FETCH_FAILED: 'Failed to retrieve privacy settings.',
    ERROR_PRIVACY_SETTINGS_UPDATE_FAILED: 'Failed to update privacy settings.',
    ERROR_PRIVACY_SETTINGS_NOT_FOUND: 'Privacy settings not found.',
    UNAUTHORIZED_PRIVACY_UPDATE_ATTEMPT: 'Unauthorized. Please log in to update privacy settings.',
    FORBIDDEN_PRIVACY_UPDATE_ATTEMPT:
        'Forbidden. You do not have permission to modify these settings.',

    // ==========================================
    // Shopping Cart Errors
    // ==========================================
    INVALID_QUANTITY: 'Invalid quantity assignment.',
    FAILED_TO_CREATE_CART: 'Failed to create cart.',

    // ==========================================
    // Wishlist Errors
    // ==========================================
    ERROR_WISHLIST_FETCH_FAILED: 'Could not load wishlist.',
    ERROR_WISHLIST_SYSTEM_ERROR: 'Failed to fetch wishlist due to network issues.',
    ERROR_WISHLIST_NOT_FOUND: 'Wishlist not found.',
    INVALID_WISHLIST_REQUEST: 'Invalid wishlist request.',
    WISHLIST_LOGIN_REQUIRED: 'Login required to manage wishlist.',
    UNSUPPORTED_WISHLIST_ACTION: 'Unsupported wishlist action.',

    // ==========================================
    // Product Review Errors
    // ==========================================
    ERROR_REVIEW_SUBMIT_FAILED: 'Failed to submit review. Please try again.',
    ERROR_DUPLICATE_REVIEW: 'You have already submitted a review for this book.',
    ERROR_REVIEW_FETCH_FAILED: 'Could not load reviews at this time.',
    ERROR_REVIEW_DELETE_FAILED: 'Failed to delete review.',
    ERROR_REVIEW_UPDATE_FAILED: 'Failed to update review.',
    INVALID_REVIEW_REQUEST: 'Invalid review submission request.',
    REVIEW_LOGIN_REQUIRED: 'Login required to submit a review.',

    // ==========================================
    // Checkout & Order Processing Errors
    // ==========================================
    CHECKOUT_LOGIN_REQUIRED: 'Login required to proceed to checkout.',
    EMPTY_CART_CHECKOUT: 'Your cart is empty. Add items before checking out.',
    INVALID_DISCOUNT_CODE: 'The provided discount code is invalid.',
    EXPIRED_DISCOUNT_CODE: 'This discount code has expired.',
    DISCOUNT_NOT_ACTIVE: 'This discount code is not currently active.',
    INSUFFICIENT_STOCK: 'One or more items in your cart exceed available stock.',
    ORDER_CREATION_FAILED: 'Failed to create your order. Please try again.',
    ORDER_NOT_FOUND: 'Order details could not be found.',
    UNAUTHORIZED_ORDER_ACCESS: 'You do not have permission to view this order.',
    PAYMENT_PROCESSING_FAILED: 'Payment processing failed. Please check your card details.',
    DUPLICATE_TRANSACTION: 'A transaction with this idempotency key is already being processed.',
} as const;

export const DB_ERROR_MAP: Record<string, string> = {
    '23505': 'This record already exists. Please use a different value.',
    '23503': 'The requested operation cannot be completed because related data is missing.',
    '23502': 'Please fill in all required fields.',
    '23514':
        'The username contains invalid characters. Only alphanumeric characters, underscores, and hyphens are allowed.',
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
