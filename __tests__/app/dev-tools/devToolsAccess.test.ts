import {
    DEV_TOOLS_DATABASE_TARGET_ERROR,
    DEV_TOOLS_UNAVAILABLE_MESSAGE,
    isDevToolsDatabaseTargetAllowed,
    isDevToolsEnabled,
} from '@/app/dev-tools/devToolsAccess';

describe('Dev Tools Utilities', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Constants', () => {
        test('has correct error and unavailable messages', () => {
            expect(DEV_TOOLS_UNAVAILABLE_MESSAGE).toBe(
                'Unauthorized: Dev tools are only available when running npm run dev.',
            );
            expect(DEV_TOOLS_DATABASE_TARGET_ERROR).toBe(
                'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.',
            );
        });
    });

    describe('isDevToolsEnabled', () => {
        test('returns true when NODE_ENV is development and FORCE_PRODUCTION is not true', () => {
            (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
            process.env.FORCE_PRODUCTION = 'false';
            expect(isDevToolsEnabled()).toBe(true);
        });

        test('returns false when NODE_ENV is production', () => {
            (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
            process.env.FORCE_PRODUCTION = 'false';
            expect(isDevToolsEnabled()).toBe(false);
        });

        test('returns false when FORCE_PRODUCTION is true even if NODE_ENV is development', () => {
            (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
            process.env.FORCE_PRODUCTION = 'true';
            expect(isDevToolsEnabled()).toBe(false);
        });
    });

    describe('isDevToolsDatabaseTargetAllowed', () => {
        test('returns false when both environment variables are missing', () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_DB_URL;
            delete process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL;
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when NEXT_PUBLIC_SUPABASE_DB_URL is missing', () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_DB_URL;
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when DEV_TOOLS_ALLOWED_SUPABASE_URL is missing', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://example.supabase.co';
            delete process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL;
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when either URL is malformed', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'not-a-valid-url';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when protocol is not http or https', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'ftp://example.supabase.co';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'ftp://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when pathname is not empty or root', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://example.supabase.co/api';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co/api';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when URL contains username or password', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://user:pass@example.supabase.co';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when URL contains query parameters or search', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://example.supabase.co?foo=bar';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when URL contains a hash', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://example.supabase.co#section';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://example.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns false when origins do not match', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://project-a.supabase.co';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://project-b.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(false);
        });

        test('returns true when valid matching origins are provided', () => {
            process.env.NEXT_PUBLIC_SUPABASE_DB_URL = 'https://project.supabase.co/';
            process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://project.supabase.co';
            expect(isDevToolsDatabaseTargetAllowed()).toBe(true);
        });
    });
});
