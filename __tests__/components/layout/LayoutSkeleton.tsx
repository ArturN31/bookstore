import { LayoutSkeleton } from '@/components/layout/LayoutSkeleton';
import { render } from '@testing-library/react';

describe('LayoutSkeleton', () => {
    it('renders the container with the pulse animation class', () => {
        const { container } = render(<LayoutSkeleton />);

        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass('animate-pulse');
        expect(wrapper).toHaveClass('mx-auto', 'max-w-375');
    });

    it('renders the hero skeleton and the correct number of grid items', () => {
        const { container } = render(<LayoutSkeleton />);

        const hero = container.querySelector('.h-75');
        expect(hero).toBeInTheDocument();
        expect(hero).toHaveClass('bg-slate-200', 'w-full');

        const skeletonElements = container.querySelectorAll('.bg-slate-200');
        expect(skeletonElements.length).toBe(17);
    });

    it('matches the snapshot', () => {
        const { asFragment } = render(<LayoutSkeleton />);
        expect(asFragment()).toMatchSnapshot();
    });
});
