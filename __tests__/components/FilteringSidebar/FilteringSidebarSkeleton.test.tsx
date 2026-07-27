import { render } from '@testing-library/react';
import { FilteringSidebarSkeleton } from '@/components/FilteringSidebar/FilteringSidebarSkeleton';

describe('FilteringSidebarSkeleton', () => {
    it('should render successfully', () => {
        const { container } = render(<FilteringSidebarSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('should render the correct number of skeleton elements', () => {
        const { container } = render(<FilteringSidebarSkeleton />);
        const skeletonElements = container.querySelectorAll('.MuiSkeleton-root');
        expect(skeletonElements.length).toBe(17);
    });
});
