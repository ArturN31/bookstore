import { NextResponse } from 'next/server';
import { processDevToolsAuditOutbox } from '@/utils/security/devToolsAuditOutbox';

export const dynamic = 'force-dynamic';

/**
 * Delivers pending DevTools audit events; protect this endpoint with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const summary = await processDevToolsAuditOutbox();
        return NextResponse.json({ success: true, summary }, { status: 200 });
    } catch (error: unknown) {
        console.error('[SecurityAudit] DevTools audit outbox processing failed.', error);
        return NextResponse.json(
            { success: false, error: 'Audit outbox processing failed.' },
            { status: 500 },
        );
    }
}
