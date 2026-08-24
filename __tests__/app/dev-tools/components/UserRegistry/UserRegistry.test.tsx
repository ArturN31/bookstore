import { createAdminClient } from '@/utils/db/admin';
import { render, screen } from '@testing-library/react';
import { UserRegistry } from '@/app/dev-tools/components/UserRegistry/UserRegistry';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

jest.mock('@/app/dev-tools/components/UserRegistry/AdminSection', () => ({
    AdminSection: ({ adminUser }: { adminUser: { email?: string } }) => (
        <div data-testid="admin-section">Admin: {adminUser?.email}</div>
    ),
}));

jest.mock('@/app/dev-tools/components/UserRegistry/UsersSection', () => ({
    UsersSection: ({ standardUsers }: { standardUsers: Array<{ id: string }> }) => (
        <div data-testid="users-section">Standard Users Count: {standardUsers.length}</div>
    ),
}));

const mockCreateAdminClient = jest.mocked(createAdminClient);

describe('UserRegistry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render access denied error message when supabase error occurs', async () => {
        mockCreateAdminClient.mockResolvedValue({
            auth: {
                admin: {
                    listUsers: jest.fn().mockResolvedValue({
                        data: { users: [] },
                        error: { message: 'Database failure' },
                    }),
                },
            },
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await UserRegistry();
        render(ui);

        expect(screen.getByText(/Registry_Access_Denied/i)).toBeInTheDocument();
        expect(screen.getByText(/Fault_Code: Database failure/i)).toBeInTheDocument();
    });

    it('should render AdminSection and UsersSection successfully when users are returned', async () => {
        const mockUsers = [
            { id: '1', email: 'admin@root.com', app_metadata: { role: 'admin' } },
            { id: '2', email: 'user1@test.com' },
            { id: '3', email: 'user2@test.com' },
        ];

        mockCreateAdminClient.mockResolvedValue({
            auth: {
                admin: {
                    listUsers: jest.fn().mockResolvedValue({
                        data: { users: mockUsers },
                        error: null,
                    }),
                },
            },
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await UserRegistry();
        render(ui);

        expect(screen.getByTestId('admin-section')).toHaveTextContent('Admin: admin@root.com');
        expect(screen.getByTestId('users-section')).toHaveTextContent('Standard Users Count: 2');
    });

    it('should fallback to first user as admin when no admin role or email match exists', async () => {
        const mockUsers = [
            { id: '1', email: 'first@test.com' },
            { id: '2', email: 'second@test.com' },
        ];

        mockCreateAdminClient.mockResolvedValue({
            auth: {
                admin: {
                    listUsers: jest.fn().mockResolvedValue({
                        data: { users: mockUsers },
                        error: null,
                    }),
                },
            },
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await UserRegistry();
        render(ui);

        expect(screen.getByTestId('admin-section')).toHaveTextContent('Admin: first@test.com');
        expect(screen.getByTestId('users-section')).toHaveTextContent('Standard Users Count: 1');
    });

    it('should handle missing authUsers gracefully and fallback to empty array', async () => {
        mockCreateAdminClient.mockResolvedValue({
            auth: {
                admin: {
                    listUsers: jest.fn().mockResolvedValue({
                        data: { users: null },
                        error: null,
                    }),
                },
            },
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await UserRegistry();
        render(ui);

        expect(screen.getByTestId('admin-section')).toHaveTextContent('Admin:');
        expect(screen.getByTestId('users-section')).toHaveTextContent('Standard Users Count: 0');
    });
});
