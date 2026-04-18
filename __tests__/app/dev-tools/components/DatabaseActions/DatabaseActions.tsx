import { render, screen } from '@testing-library/react';
import { DatabaseActions } from '@/app/dev-tools/components/DatabaseActions/DatabaseActions';

jest.mock('@/app/dev-tools/components/ConsoleSection', () => ({
    ConsoleSection: ({ children, title, variant }: { children: React.ReactNode; title: string; variant?: string }) => (
        <section data-testid="console-section" data-title={title} data-variant={variant}>
            {children}
        </section>
    ),
}));

jest.mock('@/app/dev-tools/components/DatabaseActions/ControlModule', () => ({
    ControlModule: ({ id, title, type }: { id: string; title: string; type: string }) => (
        <div data-testid="control-module" data-id={id} data-title={title} data-type={type}>
            {title}
        </div>
    ),
}));

describe('DatabaseActions', () => {
    it('should render Additive Injections section', () => {
        render(<DatabaseActions />);

        const sections = screen.getAllByTestId('console-section');
        const additiveSection = sections.find(s => s.getAttribute('data-title') === 'Additive Injections');
        
        expect(additiveSection).toBeInTheDocument();
    });

    it('should render Danger Zone section with danger variant', () => {
        render(<DatabaseActions />);

        const sections = screen.getAllByTestId('console-section');
        const dangerSection = sections.find(s => s.getAttribute('data-title') === 'Danger Zone');
        
        expect(dangerSection).toHaveAttribute('data-variant', 'danger');
    });

    it('should render all additive injection modules', () => {
        render(<DatabaseActions />);

        const modules = screen.getAllByTestId('control-module');
        
        const additiveIds = ['ADD_01', 'ADD_02', 'ADD_03', 'ADD_04', 'ADD_05', 'ADD_06'];
        additiveIds.forEach(id => {
            const module = modules.find(m => m.getAttribute('data-id') === id);
            expect(module).toBeInTheDocument();
        });
    });

    it('should render all danger zone modules', () => {
        render(<DatabaseActions />);

        const modules = screen.getAllByTestId('control-module');
        
        const dangerIds = ['DANGER_01', 'DANGER_02'];
        dangerIds.forEach(id => {
            const module = modules.find(m => m.getAttribute('data-id') === id);
            expect(module).toBeInTheDocument();
        });
    });

    it('should render Orders_Append module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Orders_Append')).toBeInTheDocument();
    });

    it('should render Promo_Generate module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Promo_Generate')).toBeInTheDocument();
    });

    it('should render Review_Bomb module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Review_Bomb')).toBeInTheDocument();
    });

    it('should render Carts_Populate module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Carts_Populate')).toBeInTheDocument();
    });

    it('should render Wishlist_Fill module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Wishlist_Fill')).toBeInTheDocument();
    });

    it('should render Books_Expansion module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Books_Expansion')).toBeInTheDocument();
    });

    it('should render Atomic Reset module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Atomic Reset')).toBeInTheDocument();
    });

    it('should render Stock_Purge module', () => {
        render(<DatabaseActions />);

        expect(screen.getByText('Stock_Purge')).toBeInTheDocument();
    });

    it('should have correct grid layout structure', () => {
        const { container } = render(<DatabaseActions />);

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('lg:grid-cols-12');
    });
});
