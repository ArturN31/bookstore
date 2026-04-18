import { updateUsername } from '@/data/actions/UsernameForm/UsernameRepository';

describe('UsernameRepository', () => {
    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateUsername', () => {
        it('should update user username by user id', async () => {
            mockSupabase.eq.mockResolvedValue({ data: null, error: null });

            await updateUsername(mockSupabase, 'user-123', 'newusername');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSupabase.update).toHaveBeenCalledWith({ username: 'newusername' });
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should return success when update succeeds', async () => {
            mockSupabase.eq.mockResolvedValue({ data: { username: 'newusername' }, error: null });

            const result = await updateUsername(mockSupabase, 'user-123', 'newusername');

            expect(result.error).toBeNull();
        });

        it('should return error when update fails', async () => {
            mockSupabase.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

            const result = await updateUsername(mockSupabase, 'user-123', 'newusername');

            expect(result.error).toBeDefined();
        });
    });
});
