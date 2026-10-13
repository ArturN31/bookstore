import { headers } from 'next/headers';
import { getAppClientIp } from '@/utils/network/getAppClientIp';

jest.mock('next/headers', () => ({ headers: jest.fn() }));

describe('getAppClientIp', () => {
    const mockedHeaders = jest.mocked(headers);
    const originalNodeEnv = process.env.NODE_ENV;

    const setHeaders = (values: Record<string, string>) => {
        mockedHeaders.mockResolvedValue(new Headers(values) as never);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV');
        else Reflect.set(process.env, 'NODE_ENV', originalNodeEnv);
    });

    it('prefers the Cloudflare client address and validates it', async () => {
        setHeaders({
            'cf-connecting-ip': '203.0.113.10',
            'x-real-ip': '203.0.113.20',
        });

        await expect(getAppClientIp()).resolves.toBe('203.0.113.10');
    });

    it('uses a valid real IP when the Cloudflare value is malformed', async () => {
        setHeaders({
            'cf-connecting-ip': 'not-an-ip',
            'x-real-ip': '2001:db8::1',
        });

        await expect(getAppClientIp()).resolves.toBe('2001:db8::1');
    });

    it('does not trust client-controlled forwarded-for values', async () => {
        setHeaders({ 'x-forwarded-for': '198.51.100.1, invalid, 203.0.113.9' });

        await expect(getAppClientIp()).resolves.toBe('unknown');
    });

    it('returns an explicit unknown sentinel when no valid address is available', async () => {
        setHeaders({ 'x-forwarded-for': 'invalid, malformed' });

        await expect(getAppClientIp()).resolves.toBe('unknown');
    });

    it('throws in production if no trusted client IP header is available', async () => {
        Reflect.set(process.env, 'NODE_ENV', 'production');
        setHeaders({ 'x-forwarded-for': '198.51.100.1' });

        await expect(getAppClientIp()).rejects.toThrow('No trusted client IP header');
    });
});
