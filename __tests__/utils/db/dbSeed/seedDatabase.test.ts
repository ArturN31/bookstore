import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createAdminClient } from '@/utils/db/admin';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('@/utils/db/dbSeed/generateBook', () => ({ generateBooksArray: jest.fn() }));
jest.mock('@/utils/db/dbSeed/generateDiscounts', () => ({ generateDiscounts: jest.fn() }));
jest.mock('@/utils/db/dbSeed/generateOrders', () => ({ generateOrdersAndItems: jest.fn() }));
jest.mock('@/utils/db/dbSeed/generateReview', () => ({ generateReviewsArray: jest.fn() }));
jest.mock('@/utils/db/dbSeed/generateUsers', () => ({
    assertGeneratedUserIdentities: jest.fn(),
    generateMockUsersArray: jest.fn(),
}));

describe('runFullDatabaseSeed safety boundary', () => {
    const env = process.env as Record<string, string | undefined>;
    const originalNodeEnv = process.env.NODE_ENV;
    const originalDatabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL;
    const originalAllowedDatabaseUrl = process.env.DEV_TOOLS_ALLOWED_SUPABASE_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        env.NODE_ENV = 'development';
        env.NEXT_PUBLIC_SUPABASE_DB_URL = 'http://127.0.0.1:54321';
        env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'http://127.0.0.1:54321';
    });

    afterAll(() => {
        env.NODE_ENV = originalNodeEnv;
        env.NEXT_PUBLIC_SUPABASE_DB_URL = originalDatabaseUrl;
        env.DEV_TOOLS_ALLOWED_SUPABASE_URL = originalAllowedDatabaseUrl;
    });

    it('refuses to reset outside development before creating an admin client or authorizing writes', async () => {
        env.NODE_ENV = 'production';
        const authorizeWrite = jest.fn();

        await expect(runFullDatabaseSeed(authorizeWrite)).rejects.toThrow(
            'Unauthorized: Dev tools are only available when running npm run dev.',
        );

        expect(createAdminClient).not.toHaveBeenCalled();
        expect(authorizeWrite).not.toHaveBeenCalled();
    });

    it('refuses to reset without an explicitly allowed database target', async () => {
        delete env.DEV_TOOLS_ALLOWED_SUPABASE_URL;
        const authorizeWrite = jest.fn();

        await expect(runFullDatabaseSeed(authorizeWrite)).rejects.toThrow(
            'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.',
        );

        expect(createAdminClient).not.toHaveBeenCalled();
        expect(authorizeWrite).not.toHaveBeenCalled();
    });

    it('refuses to reset when the active target differs from the allowlisted database', async () => {
        env.DEV_TOOLS_ALLOWED_SUPABASE_URL = 'https://other-project.supabase.co';
        const authorizeWrite = jest.fn();

        await expect(runFullDatabaseSeed(authorizeWrite)).rejects.toThrow(
            'Dev tools are blocked because the intended development database is not explicitly configured or does not match the active Supabase URL.',
        );

        expect(createAdminClient).not.toHaveBeenCalled();
        expect(authorizeWrite).not.toHaveBeenCalled();
    });
});
