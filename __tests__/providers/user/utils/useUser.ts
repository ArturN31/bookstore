import { useUserState, useUserActions } from '@/providers/user/utils/useUser';
import { UserStateContext, UserActionsContext } from '@/providers/user/UserContext';

describe('useUser', () => {
    describe('useUserState', () => {
        it('should throw error when used outside UserProvider', () => {
            // Mock useContext to return undefined
            jest.spyOn(require('react'), 'useContext').mockReturnValue(undefined);

            expect(() => useUserState()).toThrow('useUserState must be used within UserProvider');
        });

        it('should return context when used inside UserProvider', () => {
            const mockContext = { loggedIn: true, user: null };
            jest.spyOn(require('react'), 'useContext').mockReturnValue(mockContext);

            const result = useUserState();

            expect(result).toEqual(mockContext);
        });
    });

    describe('useUserActions', () => {
        it('should throw error when used outside UserProvider', () => {
            jest.spyOn(require('react'), 'useContext').mockReturnValue(undefined);

            expect(() => useUserActions()).toThrow('useUserActions must be used within UserProvider');
        });

        it('should return context when used inside UserProvider', () => {
            const mockContext = { refreshUser: jest.fn() };
            jest.spyOn(require('react'), 'useContext').mockReturnValue(mockContext);

            const result = useUserActions();

            expect(result).toEqual(mockContext);
        });
    });
});
