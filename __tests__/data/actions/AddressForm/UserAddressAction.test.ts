import { UserAddressAction } from '@/data/actions/AddressForm/UserAddressAction';
import {
    insertUserAddress,
    updateUserAddress,
} from '@/data/actions/AddressForm/UserAddressRepository';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/utils/db/server');
jest.mock('@/data/actions/AddressForm/UserAddressRepository');

type MockSupabaseClient = {
    auth: {
        getUser: jest.Mock;
    };
};

describe('APP - data - actions - AddressForm - UserAddressAction', () => {
    let mockSupabase: MockSupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
        };

        jest.mocked(createBackendClient).mockResolvedValue(
            mockSupabase as unknown as Awaited<ReturnType<typeof createBackendClient>>,
        );
    });

    it('returns empty state when reset is present', async () => {
        const formData = new FormData();
        formData.append('reset', 'yes');

        const result = await UserAddressAction('add', {}, formData);
        expect(result.message).toBeNull();
    });

    it('returns validation errors and raw data when Zod validation fails', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('postcode', 'INVALID_POSTCODE');

        const result = await UserAddressAction('update', {}, formData);

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

        const result = await UserAddressAction('update', {}, formData);
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

        jest.mocked(updateUserAddress).mockResolvedValue({
            data: null,
            error: 'DB fail',
        });

        const result = await UserAddressAction('update', {}, formData);

        expect(result.message).toBe('Failed to save address details.');
        expect(result.error).toBe('DB fail');
        expect(updateUserAddress).toHaveBeenCalledWith(
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
        const fields = {
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

        jest.mocked(insertUserAddress).mockResolvedValue({
            data: null,
            error: 'Insert DB failure',
        });

        const result = await UserAddressAction('add', {}, formData);

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

        jest.mocked(updateUserAddress).mockResolvedValue({
            data: [],
            error: null,
        });

        await UserAddressAction('update', {}, formData);

        expect(updateUserAddress).toHaveBeenCalledWith(
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
        const fields = {
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

        jest.mocked(insertUserAddress).mockResolvedValue({
            data: [],
            error: null,
        });

        await UserAddressAction('add', {}, formData);

        expect(insertUserAddress).toHaveBeenCalledWith(
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

    it('re-throws redirect error when redirect throws', async () => {
        const formData = new FormData();
        formData.append('city', 'Glasgow');
        formData.append('country', 'UK');
        formData.append('postcode', 'G1 1AA');
        formData.append('streetAddress', '123 St');

        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null,
        });

        jest.mocked(updateUserAddress).mockResolvedValue({
            data: [],
            error: null,
        });

        const redirectError = new Error('NEXT_REDIRECT');
        jest.mocked(redirect).mockImplementation(() => {
            throw redirectError;
        });

        await expect(UserAddressAction('update', {}, formData)).rejects.toThrow('NEXT_REDIRECT');
    });
});
