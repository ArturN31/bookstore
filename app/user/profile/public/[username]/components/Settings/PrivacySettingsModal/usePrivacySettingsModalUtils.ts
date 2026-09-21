import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';

export type PrivacyToggleKey = keyof Omit<UserPrivacySettingsDto, 'wishlist_share_token'>;

export function buildWishlistShareUrl(token: string | null): string {
    if (!token) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/user/wishlist/shared?token=${token}`;
}

export function getNextToggleSettings(
    currentSettings: UserPrivacySettingsDto,
    key: PrivacyToggleKey,
): { nextSettings: UserPrivacySettingsDto; newValue: boolean } {
    const newValue = !currentSettings[key];
    const nextSettings: UserPrivacySettingsDto = {
        ...currentSettings,
        [key]: newValue,
        wishlist_share_token:
            key === 'is_wishlist_public' && newValue ? null : currentSettings.wishlist_share_token,
    };

    return { nextSettings, newValue };
}

export function getNextRegeneratedTokenSettings(
    currentSettings: UserPrivacySettingsDto,
    newToken: string,
): UserPrivacySettingsDto {
    return {
        ...currentSettings,
        is_wishlist_public: false,
        wishlist_share_token: newToken,
    };
}
