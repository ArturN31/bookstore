export const PRIVACY_SETTINGS_ACTIONS = {
    UPDATE_PRIVACY_SETTINGS: 'UPDATE_PRIVACY_SETTINGS',
    REGENERATE_WISHLIST_SHARE_TOKEN: 'REGENERATE_WISHLIST_SHARE_TOKEN',
} as const;

export const PRIVACY_REVALIDATION_ROUTES = {
    PROFILE: (username: string) => `/user/profile/${username}`,
    PUBLIC_PROFILE: (username: string) => `/user/profile/public/${username}`,
    WISHLIST: (username: string) => `/user/wishlist/${username}`,
    REVIEWS: (username: string) => `/user/reviews/${username}`,
} as const;
