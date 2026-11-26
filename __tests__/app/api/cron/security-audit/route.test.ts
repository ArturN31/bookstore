/**
 * @jest-environment node
 */

import { GET } from '@/app/api/cron/security-audit/route';
import { processDevToolsAuditOutbox } from '@/utils/security/devToolsAuditOutbox';

jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((body: unknown, init?: { status?: number }) => ({
            json: async (): Promise<unknown> => body,
            status: init?.status ?? 200,
        })),
    },
}));

jest.mock('@/utils/security/devToolsAuditOutbox', () => ({
    processDevToolsAuditOutbox: jest.fn(),
}));

describe('DevTools audit cron route', () => {
    const originalCronSecret = process.env.CRON_SECRET;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRON_SECRET = 'test-secret';
    });

    afterAll(() => {
        if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
        else process.env.CRON_SECRET = originalCronSecret;
    });

    const createRequest = (authorization?: string): Request =>
        ({
            headers: { get: (name: string) => (name === 'authorization' ? authorization : null) },
        }) as unknown as Request;

    it('rejects requests without the configured cron secret', async () => {
        const response = await GET(createRequest('Bearer wrong'));

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: 'Unauthorized' });
        expect(processDevToolsAuditOutbox).not.toHaveBeenCalled();
    });

    it('processes the outbox for an authorized cron request', async () => {
        jest.mocked(processDevToolsAuditOutbox).mockResolvedValueOnce({
            recoveredIntents: 2,
            delivered: 4,
            retryScheduled: 1,
        });

        const response = await GET(createRequest('Bearer test-secret'));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            success: true,
            summary: { recoveredIntents: 2, delivered: 4, retryScheduled: 1 },
        });
    });

    it('returns a generic server error when processing fails', async () => {
        jest.mocked(processDevToolsAuditOutbox).mockRejectedValueOnce(
            new Error('database connection string should not be returned'),
        );
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const response = await GET(createRequest('Bearer test-secret'));

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: 'Audit outbox processing failed.',
        });
        errorSpy.mockRestore();
    });
});
