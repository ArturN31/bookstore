import { cookies } from 'next/headers';
import { createBackendClient } from '@/utils/db/server';
import { CONSENT_VERSION } from '@/providers/ConsentProvider';
import { saveUserConsentToSupabase } from '@/data/consentCookies/ConsentAction';

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

const mockCreateBackendClient = createBackendClient as jest.MockedFunction<
    typeof createBackendClient
>;

describe('consentRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveUserConsentToSupabase', () => {
        test('does nothing when no user is authenticated', async () => {
            const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
            const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
            const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

            mockCreateBackendClient.mockResolvedValueOnce({
                auth: { getUser: mockGetUser },
                from: mockFrom,
            } as unknown as Awaited<ReturnType<typeof createBackendClient>>);

            await saveUserConsentToSupabase(true, CONSENT_VERSION);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).not.toHaveBeenCalled();
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        test('upserts user consent when authenticated', async () => {
            const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
            const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert });
            const mockGetUser = jest.fn().mockResolvedValue({
                data: { user: { id: 'user-123' } },
            });

            mockCreateBackendClient.mockResolvedValueOnce({
                auth: { getUser: mockGetUser },
                from: mockFrom,
            } as unknown as Awaited<ReturnType<typeof createBackendClient>>);

            await saveUserConsentToSupabase(true, CONSENT_VERSION);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('user_consents');
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'user-123',
                    analytics: true,
                    version: CONSENT_VERSION,
                    updated_at: expect.any(String),
                }),
                { onConflict: 'user_id' },
            );
        });
    });
});
