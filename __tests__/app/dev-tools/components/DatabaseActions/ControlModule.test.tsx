import { render, screen } from '@testing-library/react';
import { ControlModule } from '@/app/dev-tools/components/DatabaseActions/ControlModule';

jest.mock('@/app/dev-tools/components/DatabaseActions/SeedControl', () => ({
    SeedControl: ({ type }: { type: string }) => (
        <div data-testid="seed-control" data-type={type}>SeedControl</div>
    ),
}));

describe('ControlModule', () => {
    const defaultProps = {
        id: 'TEST_01',
        title: 'Test Module',
        description: 'Test description',
        type: 'add_books' as const,
    };

    it('should render ID badge', () => {
        render(<ControlModule {...defaultProps} />);

        const badge = screen.getByText('TEST_01');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-gunmetal');
    });

    it('should render title', () => {
        render(<ControlModule {...defaultProps} />);

        expect(screen.getByText('Test Module')).toBeInTheDocument();
    });

    it('should render description', () => {
        render(<ControlModule {...defaultProps} />);

        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render SeedControl with correct type', () => {
        render(<ControlModule {...defaultProps} />);

        const seedControl = screen.getByTestId('seed-control');
        expect(seedControl).toHaveAttribute('data-type', 'add_books');
    });

    it('should handle all action types', () => {
        const types: ControlModuleProps['type'][] = [
            'add_sales',
            'seed_discounts',
            'reset',
            'stock_purge',
            'review_bomb',
            'add_carts',
            'add_wishlists',
            'add_books',
        ];

        types.forEach((type) => {
            const { container } = render(
                <ControlModule {...defaultProps} type={type} />
            );
            const seedControl = container.querySelector('[data-type]');
            expect(seedControl).toHaveAttribute('data-type', type);
        });
    });

    it('should have correct styling classes', () => {
        const { container } = render(<ControlModule {...defaultProps} />);

        const rootDiv = container.firstChild as HTMLElement;
        expect(rootDiv).toHaveClass('bg-white');
        expect(rootDiv).toHaveClass('p-6');
    });
});

type ControlModuleProps = {
    id: string;
    title: string;
    description: string;
    type:
        | 'add_sales'
        | 'seed_discounts'
        | 'reset'
        | 'stock_purge'
        | 'review_bomb'
        | 'add_carts'
        | 'add_wishlists'
        | 'add_books';
};
