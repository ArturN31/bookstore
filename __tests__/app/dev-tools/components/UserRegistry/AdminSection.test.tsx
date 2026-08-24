import { render, screen } from '@testing-library/react';
import { User } from '@supabase/supabase-js';
import { AdminSection } from '@/app/dev-tools/components/UserRegistry/AdminSection';

jest.mock('@/app/dev-tools/components/UserRegistry/CredentialRow', () => ({
    CredentialRow: ({
        label,
        value,
        isPrimary,
    }: {
        label: string;
        value: string;
        isPrimary?: boolean;
    }) => (
        <div
            data-testid="credential-row"
            data-label={label}
            data-value={value}
            data-is-primary={String(isPrimary)}
        >
            {label}: {value}
        </div>
    ),
}));

describe('AdminSection', () => {
    it('should render admin email and permissions correctly', () => {
        const mockUser = {
            email: 'admin@root.com',
        } as unknown as User;

        render(<AdminSection adminUser={mockUser} />);

        const credentialRow = screen.getByTestId('credential-row');
        expect(credentialRow).toHaveAttribute('data-label', 'Master_Root_Access');
        expect(credentialRow).toHaveAttribute('data-value', 'admin@root.com');
        expect(credentialRow).toHaveAttribute('data-is-primary', 'true');

        expect(screen.getByText('System_Permissions')).toBeInTheDocument();
        expect(screen.getByText('Write_All')).toBeInTheDocument();
        expect(screen.getByText('Bypass_RLS')).toBeInTheDocument();
    });

    it('should fallback to unassigned@root when email is missing', () => {
        const mockUser = {} as unknown as User;

        render(<AdminSection adminUser={mockUser} />);

        const credentialRow = screen.getByTestId('credential-row');
        expect(credentialRow).toHaveAttribute('data-value', 'unassigned@root');
    });
});
