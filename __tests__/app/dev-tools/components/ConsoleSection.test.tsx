import { render, screen } from '@testing-library/react';
import { ConsoleSection } from '@/app/dev-tools/components/ConsoleSection';

describe('ConsoleSection', () => {
    it('should render with default variant', () => {
        render(
            <ConsoleSection title="Test Title">
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.getByText('Test Title')).toHaveClass('bg-gunmetal');
        expect(screen.getByText('Test Title')).toHaveClass('text-white');
    });

    it('should render with danger variant', () => {
        render(
            <ConsoleSection
                title="Danger Title"
                variant="danger"
            >
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(screen.getByText('Danger Title')).toBeInTheDocument();
        expect(screen.getByText('Danger Title')).toHaveClass('bg-yellow');
        expect(screen.getByText('Danger Title')).toHaveClass('text-gunmetal');
    });

    it('should render subtitle when provided', () => {
        render(
            <ConsoleSection
                title="Title"
                subtitle="Subtitle"
            >
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(screen.getByText('// Subtitle')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
        render(
            <ConsoleSection title="Title">
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(screen.queryByText('//')).not.toBeInTheDocument();
    });

    it('should render with correct spacing classes', () => {
        const { container } = render(
            <ConsoleSection title="Title">
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(container.querySelector('section')).toHaveClass('space-y-4');
    });

    it('should render divider with default variant class', () => {
        const { container } = render(
            <ConsoleSection title="Title">
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(container.querySelector('.bg-gunmetal\\/10')).toBeInTheDocument();
    });

    it('should render divider with danger variant class', () => {
        const { container } = render(
            <ConsoleSection
                title="Title"
                variant="danger"
            >
                <div>Content</div>
            </ConsoleSection>,
        );

        expect(container.querySelector('.bg-yellow\\/30')).toBeInTheDocument();
    });
});
