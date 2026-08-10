import { createBackendClient } from '@/utils/db/server';
import { fetchUserAuthData } from '@/data/user/UserRepository';

export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
export const OTHER_UUID = '987e6543-e89b-12d3-a456-426614174000';

export const mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: VALID_UUID } },
    error: null,
});

export const mockSupabaseClient = {
    auth: {
        getUser: mockGetUser,
    },
};

export const setupUserServiceTestDefaults = (): void => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_UUID } },
        error: null,
    });

    (createBackendClient as jest.MockedFunction<typeof createBackendClient>).mockResolvedValue(
        mockSupabaseClient as unknown as Awaited<ReturnType<typeof createBackendClient>>,
    );
    (fetchUserAuthData as jest.MockedFunction<typeof fetchUserAuthData>).mockResolvedValue({
        data: { user: { id: VALID_UUID, email: 'test@test.com' } },
        error: null,
    } as unknown as Awaited<ReturnType<typeof fetchUserAuthData>>);
};

describe('UserServiceTestHelpers', () => {
    it('should export valid test constants and helpers', () => {
        expect(VALID_UUID).toBeDefined();
        expect(OTHER_UUID).toBeDefined();
    });
});
