import { UserAddressAction } from '@/data/actions/AddressForm/UserAddressAction';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

describe('APP - data - actions - AddressForm - UserAddressAction', () => {
    const mockSupabase = {
        auth: { getUser: jest.fn() },
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (createBackendClient as jest.Mock).mockResolvedValue(mockSupabase);

        mockSupabase.from.mockReturnThis();
        mockSupabase.update.mockReturnThis();
        mockSupabase.insert.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
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

        mockSupabase.update.mockReturnThis();
        mockSupabase.eq.mockResolvedValue({ error: { message: 'DB fail' } });

        const result = await UserAddressAction('update', {}, formData);

        expect(result.message).toBe('Failed to save address details.');
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
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

        mockSupabase.update.mockReturnThis();
        mockSupabase.eq.mockResolvedValue({ error: null });

        await UserAddressAction('update', {}, formData);

        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockSupabase.update).toHaveBeenCalled();
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
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

        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
        mockSupabase.insert.mockResolvedValue({ error: null });

        await UserAddressAction('add', {}, formData);

        expect(mockSupabase.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                id: '123',
                first_name: 'John',
            }),
        );
    });
});
