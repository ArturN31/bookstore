// securityAuditLogger.ts
import 'server-only';
import { after } from 'next/server';
import { createAdminClient } from '@/utils/db/admin';
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

export type SecurityAuditMetadataValue =
    string | number | boolean | null | undefined | object | Array<unknown>;

export type SecurityAuditMetadata = Record<string, SecurityAuditMetadataValue>;

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'captchatoken', 'authorization', 'cookie'];

const sanitizeMetadata = (obj: SecurityAuditMetadata): SecurityAuditMetadata => {
    const sanitized: SecurityAuditMetadata = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some((sensitive: string) => lowerKey.includes(sensitive)))
            sanitized[key] = '[REDACTED]';
        else if (value instanceof Error) sanitized[key] = value.message;
        else if (
            value !== null &&
            typeof value === 'object' &&
            'message' in value &&
            typeof (value as { message: unknown }).message === 'string'
        )
            sanitized[key] = (value as { message: string }).message;
        else if (value && typeof value === 'object' && !Array.isArray(value))
            sanitized[key] = sanitizeMetadata(value as SecurityAuditMetadata);
        else sanitized[key] = value;
    }
    return sanitized;
};

export async function recordSecurityAuditLog(
    eventType: SecurityAuditEventType,
    userId: string | null,
    metadata: SecurityAuditMetadata = {},
    requestHeaders?: Headers,
): Promise<void> {
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
                '[SecurityAudit] Warning: recordSecurityAuditLog was called outside request context without explicit headers.',
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

    after(async () => {
        try {
            const supabaseAdmin = await createAdminClient();
            const { error } = await supabaseAdmin.from('audit_logs').insert({
                user_id: userId,
                event_type: eventType,
                metadata: enrichedMetadata,
            });

            if (error)
                console.error(
                    '[SecurityAudit] Failed to write security audit log to database:',
                    error.message,
                );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(
                '[SecurityAudit] Unexpected critical error in background audit logger:',
                errorMessage,
            );
        }
    });
}
