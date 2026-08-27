export const sanitizeText = (val: string): string => {
    let sanitized = val;
    let previous = '';
    while (sanitized !== previous) {
        previous = sanitized;
        sanitized = sanitized.replace(/<[^>]*>?/gm, '');
    }
    return sanitized.trim();
};
