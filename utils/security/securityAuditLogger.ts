import 'server-only';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { headers } from 'next/headers';

export type SecurityAuditEventType =
    | 'PASSWORD_CHANGE'
    | 'FAILED_LOGIN'
    | 'SUCCESSFUL_LOGIN'
    | 'SUCCESSFUL_REGISTRATION'
    | 'FAILED_REGISTRATION'
    | 'ADMIN_ACTION'
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'FAILED_AUTHENTICATION_ATTEMPT';

export type SecurityAuditMetadata = Record<
    string,
    string | number | boolean | null | undefined | object | Array<unknown>
>;

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'captchatoken', 'authorization', 'cookie'];

const sanitizeMetadata = (obj: SecurityAuditMetadata): SecurityAuditMetadata => {
    const sanitized: SecurityAuditMetadata = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive)))
            sanitized[key] = '[REDACTED]';
        else if (
            value instanceof Error ||
            (value !== null &&
                typeof value === 'object' &&
                'message' in value &&
                typeof (value as { message: unknown }).message === 'string')
        )
            sanitized[key] = (value as { message: string }).message;
        else if (value && typeof value === 'object' && !Array.isArray(value))
            sanitized[key] = sanitizeMetadata(value as SecurityAuditMetadata);
        else sanitized[key] = value as string | number | boolean | null | undefined;
    }
    return sanitized;
};

export async function recordSecurityAuditLog(
    eventType: SecurityAuditEventType,
    userId: string | null,
    metadata: SecurityAuditMetadata = {},
    requestHeaders?: Headers,
): Promise<void> {
    try {
        let clientIp = 'unknown';
        let userAgent = 'unknown';

        if (requestHeaders) {
            clientIp =
                requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
                requestHeaders.get('x-real-ip') ??
                'unknown';
            userAgent = requestHeaders.get('user-agent') ?? 'unknown';
        } else {
            try {
                const headerList = await headers();
                clientIp =
                    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
                    headerList.get('x-real-ip') ??
                    'unknown';
                userAgent = headerList.get('user-agent') ?? 'unknown';
            } catch {
                console.warn(
                    '[SecurityAudit] Warning: recordSecurityAuditLog was called in an Edge or non-request context without explicit requestHeaders. IP and User-Agent will be logged as unknown.',
                );
            }
        }

        const cleanedMetadata = sanitizeMetadata(metadata);

        const enrichedMetadata: SecurityAuditMetadata = {
            ...cleanedMetadata,
            ip: clientIp,
            userAgent,
            timestamp: new Date().toISOString(),
        };

        const supabase = await createBackendClient();

        const result = await safeSupabaseQuery<null>(async () => {
            const { error } = await supabase.from('audit_logs').insert({
                user_id: userId,
                event_type: eventType,
                metadata: enrichedMetadata,
            });
            return { data: null, error };
        });

        if (result.error) {
            console.error(
                '[SecurityAudit] Failed to write security audit log to database:',
                result.error,
            );
        }
    } catch (err: unknown) {
        console.error('[SecurityAudit] Unexpected critical error in security audit logger:', err);
    }
}
