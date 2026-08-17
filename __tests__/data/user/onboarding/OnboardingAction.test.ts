import { OnboardingAction } from '@/data/user/onboarding/OnboardingAction';
import {
    insertOnboardingRecord,
    updateOnboardingRecord,
} from '@/data/user/onboarding/OnboardingRepository';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

jest.mock('@/data/advancedFiltering/FilteringConstants', () => ({
    DEFAULT_FILTERING_CONSTANTS: {
        categories: [],
        tags: [],
    },
    getFilteringConstants: jest.fn().mockResolvedValue({
        categories: [],
        tags: [],
    }),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/user/address/UserAddressRepository');
jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) =>
        err instanceof Error ? err.message : String(err),
    ),
}));

type MockSupabaseClient = {
    auth: {
        getUser: jest.Mock;
    };
};

describe('APP - data - actions - AddressForm - OnboardingAction', () => {
    let mockSupabase: MockSupabaseClient;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
        };

        jest.mocked(createBackendClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('returns empty state when reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'yes');

        const result = await OnboardingAction('add', {}, formData);
        expect(result.message).toBeNull();
    });

    it('returns validation errors and raw data when Zod validation fails', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('postcode', 'INVALID_POSTCODE');

        const result = await OnboardingAction('update', {}, formData);

        expect(result.validationErrors).toBeDefined();
        expect(result.message).toBe('Please correct the highlighted errors.');
        expect(createBackendClient).not.toHaveBeenCalled();
    });

    it('returns authentication error if user is not found or auth error occurs', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth failed' },
        });

        const result = await OnboardingAction('update', {}, formData);
        expect(result.message).toBe('Session expired. Please log in again.');
    });

    it('returns session expired when user is null and authError is null', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const result = await OnboardingAction('update', {}, formData);
        expect(result.message).toBe('Session expired. Please log in again.');
    });

    it('handles database error during update', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(updateOnboardingRecord).mockResolvedValue({
            data: null,
            error: 'DB fail',
        });

        const result = await OnboardingAction('update', {}, formData);

        expect(result.message).toBe('Failed to save address details.');
        expect(result.error).toBe('DB fail');
        expect(updateOnboardingRecord).toHaveBeenCalledWith(
            mockSupabase,
            '123',
            expect.objectContaining({
                city: 'Glasgow',
                country: 'UK',
                postcode: 'G1 1AA',
                street_address: '123 St',
            }),
        );
    });

    it('handles database error during insert in add mode', async () => {
        const formData = new FormData();
        const fields: Record<string, string> = {
            firstName: 'John',
            lastName: 'Doe',
            dob: '1990-01-01',
            phoneNumber: '12345678',
            city: 'Glasgow',
            country: 'UK',
            postcode: 'G1 1AA',
            streetAddress: '123 St',
        };
        Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(insertOnboardingRecord).mockResolvedValue({
            data: null,
            error: 'Insert DB failure',
        });

        const result = await OnboardingAction('add', {}, formData);

        expect(result.message).toBe('Failed to save address details.');
        expect(result.error).toBe('Insert DB failure');
    });

    it('successfully updates address, revalidates, and redirects', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(updateOnboardingRecord).mockResolvedValue({
            data: [],
            error: null,
        });

        await OnboardingAction('update', {}, formData);

        expect(updateOnboardingRecord).toHaveBeenCalledWith(
            mockSupabase,
            '123',
            expect.objectContaining({
                city: 'Glasgow',
                country: 'UK',
                postcode: 'G1 1AA',
                street_address: '123 St',
            }),
        );
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('successfully inserts new user address in add mode', async () => {
        const formData = new FormData();
        const fields: Record<string, string> = {
            firstName: 'John',
            lastName: 'Doe',
            dob: '1990-01-01',
            phoneNumber: '12345678',
            city: 'Glasgow',
            country: 'UK',
            postcode: 'G1 1AA',
            streetAddress: '123 St',
        };
        Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(insertOnboardingRecord).mockResolvedValue({
            data: [],
            error: null,
        });

        await OnboardingAction('add', {}, formData);

        expect(insertOnboardingRecord).toHaveBeenCalledWith(
            mockSupabase,
            expect.objectContaining({
                id: '123',
                first_name: 'John',
                last_name: 'Doe',
            }),
        );
        expect(revalidatePath).toHaveBeenCalledWith('/user/profile');
        expect(redirect).toHaveBeenCalledWith('/user/profile');
    });

    it('re-throws NEXT_REDIRECT error when thrown inside try block', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(updateOnboardingRecord).mockRejectedValue(new Error('NEXT_REDIRECT'));

        await expect(OnboardingAction('update', {}, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('handles unexpected exceptions and enters the catch block', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        jest.mocked(createBackendClient).mockRejectedValue(new Error('Unexpected system crash'));

        const result = await OnboardingAction('update', {}, formData);

        expect(result.message).toBe('Failed to save address details.');
        expect(result.error).toBe('Unexpected system crash');
        expect(sanitizeSupabaseError).toHaveBeenCalledWith(expect.any(Error));
    });
});
