import { render, screen } from '@testing-library/react';
import { User } from '@supabase/supabase-js';
import { UsersSection } from '@/app/dev-tools/components/UserRegistry/UsersSection';

jest.mock('@/app/dev-tools/components/UserRegistry/CredentialRow', () => ({
    CredentialRow: ({ value, variant }: { value: string; variant?: string }) => (
        <div
            data-testid="credential-row"
            data-value={value}
            data-variant={variant}
        >
            {value}
        </div>
    ),
}));

describe('UsersSection', () => {
    it('should render standard users and header count correctly', () => {
        const mockUsers = [
            { id: '1', email: 'user1@test.com' },
            { id: '2', email: 'user2@test.com' },
        ] as unknown as User[];

        render(<UsersSection standardUsers={mockUsers} />);

        expect(screen.getByText(/Standard_Identities \[02\]/i)).toBeInTheDocument();

        const credentialRows = screen.getAllByTestId('credential-row');
        expect(credentialRows).toHaveLength(2);
        expect(credentialRows[0]).toHaveAttribute('data-value', 'user1@test.com');
        expect(credentialRows[0]).toHaveAttribute('data-variant', 'minimal');
        expect(credentialRows[1]).toHaveAttribute('data-value', 'user2@test.com');
    });

    it('should handle zero standard users correctly', () => {
        render(<UsersSection standardUsers={[]} />);

        expect(screen.getByText(/Standard_Identities \[00\]/i)).toBeInTheDocument();
        expect(screen.queryAllByTestId('credential-row')).toHaveLength(0);
    });

    it('should handle users with missing email by falling back to an empty string', () => {
        const mockUsers = [{ id: '1', email: null }] as unknown as User[];

        render(<UsersSection standardUsers={mockUsers} />);

        const credentialRows = screen.getAllByTestId('credential-row');
        expect(credentialRows).toHaveLength(1);
        expect(credentialRows[0]).toHaveAttribute('data-value', '');
    });
});
