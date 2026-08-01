import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { insertUserAddress, updateUserAddress } from '@/data/user/address/UserAddressRepository';

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (callback) => await callback()),
}));

type UserTable = Database['public']['Tables']['users'];
type UserInsert = UserTable['Insert'];
type UserUpdate = UserTable['Update'];
type UserRow = UserTable['Row'];

describe('UserRepository - Address Operations', () => {
    let mockSupabase: {
        from: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase = {
            from: jest.fn(),
        };
    });

    describe('insertUserAddress', () => {
        it('should successfully insert a user address and return the created rows', async () => {
            const mockPayload: UserInsert = {
                id: 'user-123',
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1990-01-01',
                street_address: '123 Main St',
                city: 'Hamilton',
                postcode: 'ML3 0AA',
                country: 'United Kingdom',
                phone_number: '1234567890',
            };

            const mockData: UserRow[] = [
                {
                    id: 'user-123',
                    first_name: 'John',
                    last_name: 'Doe',
                    date_of_birth: '1990-01-01',
                    street_address: '123 Main St',
                    city: 'Hamilton',
                    postcode: 'ML3 0AA',
                    country: 'United Kingdom',
                    phone_number: '1234567890',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    username: 'johndoe',
                },
            ];

            const selectMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
            const insertMock = jest.fn().mockReturnValue({ select: selectMock });
            mockSupabase.from.mockReturnValue({ insert: insertMock });

            const result = await insertUserAddress(
                mockSupabase as unknown as SupabaseClient<Database>,
                mockPayload,
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(insertMock).toHaveBeenCalledWith(mockPayload);
            expect(selectMock).toHaveBeenCalled();
            expect(result).toEqual({ data: mockData, error: null });
        });

        it('should handle errors during user address insertion', async () => {
            const mockPayload: UserInsert = {
                id: 'user-123',
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1990-01-01',
                street_address: '123 Main St',
                city: 'Hamilton',
                postcode: 'ML3 0AA',
                country: 'United Kingdom',
                phone_number: '1234567890',
            };

            const mockError = { message: 'Insert failed', code: '23505', details: '', hint: '' };

            const selectMock = jest.fn().mockResolvedValue({ data: null, error: mockError });
            const insertMock = jest.fn().mockReturnValue({ select: selectMock });
            mockSupabase.from.mockReturnValue({ insert: insertMock });

            const result = await insertUserAddress(
                mockSupabase as unknown as SupabaseClient<Database>,
                mockPayload,
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(insertMock).toHaveBeenCalledWith(mockPayload);
            expect(selectMock).toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: mockError });
        });
    });

    describe('updateUserAddress', () => {
        it('should successfully update a user address and return the updated rows', async () => {
            const userId = 'user-123';
            const mockPayload: UserUpdate = {
                street_address: '456 New St',
            };

            const mockData: UserRow[] = [
                {
                    id: userId,
                    first_name: 'John',
                    last_name: 'Doe',
                    date_of_birth: '1990-01-01',
                    street_address: '456 New St',
                    city: 'Hamilton',
                    postcode: 'ML3 0AA',
                    country: 'United Kingdom',
                    phone_number: '1234567890',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    username: 'johndoe',
                },
            ];

            const selectMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
            const eqMock = jest.fn().mockReturnValue({ select: selectMock });
            const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
            mockSupabase.from.mockReturnValue({ update: updateMock });

            const result = await updateUserAddress(
                mockSupabase as unknown as SupabaseClient<Database>,
                userId,
                mockPayload,
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(updateMock).toHaveBeenCalledWith(mockPayload);
            expect(eqMock).toHaveBeenCalledWith('id', userId);
            expect(selectMock).toHaveBeenCalled();
            expect(result).toEqual({ data: mockData, error: null });
        });

        it('should handle errors during user address updates', async () => {
            const userId = 'user-123';
            const mockPayload: UserUpdate = {
                street_address: '456 New St',
            };

            const mockError = { message: 'Update failed', code: '42P01', details: '', hint: '' };

            const selectMock = jest.fn().mockResolvedValue({ data: null, error: mockError });
            const eqMock = jest.fn().mockReturnValue({ select: selectMock });
            const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
            mockSupabase.from.mockReturnValue({ update: updateMock });

            const result = await updateUserAddress(
                mockSupabase as unknown as SupabaseClient<Database>,
                userId,
                mockPayload,
            );

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(updateMock).toHaveBeenCalledWith(mockPayload);
            expect(eqMock).toHaveBeenCalledWith('id', userId);
            expect(selectMock).toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: mockError });
        });
    });
});
