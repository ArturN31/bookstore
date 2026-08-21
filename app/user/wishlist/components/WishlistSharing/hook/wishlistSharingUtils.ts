export const getShareUrl = (isPublic: boolean, username: string, shareToken: string): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (isPublic && username)
        return `${origin}/user/wishlist/shared/${encodeURIComponent(username)}`;
    if (!isPublic && shareToken)
        return `${origin}/user/wishlist/shared/token/${encodeURIComponent(shareToken)}`;
    return '';
};

export const getErrorMessage = (err: unknown, fallbackMessage: string): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return fallbackMessage;
};
