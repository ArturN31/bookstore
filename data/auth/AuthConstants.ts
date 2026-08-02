export const AUTH_ROUTES = {
    ROOT: '/',
    SIGN_IN: '/user/auth/signin',
    PROFILE: '/user/profile',
} as const;

export const AUTH_MESSAGES = {
    CHANGE_PASSWORD_VALIDATION: 'Validation failed. Please check the requirements.',
    SESSION_EXPIRED: 'Session expired. Please log in again.',
    SIGN_IN_VALIDATION: 'Please correct the highlighted errors.',
    SIGN_IN_CAPTCHA_ERROR: 'Authentication rejected due to an invalid or missing security token.',
    SIGN_UP_VALIDATION: 'Please resolve the validation errors.',
    SIGN_UP_CAPTCHA_ERROR: 'Registration rejected due to an invalid or missing security token.',
} as const;
