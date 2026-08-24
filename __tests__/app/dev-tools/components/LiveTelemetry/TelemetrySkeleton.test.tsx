import { TelemetrySkeleton } from '@/app/dev-tools/components/LiveTelemetry/TelemetrySkeleton';
import { render } from '@testing-library/react';

describe('TelemetrySkeleton', () => {
    it('should render 5 skeleton blocks correctly', () => {
        const { container } = render(<TelemetrySkeleton />);
        const skeletonCards = container.querySelectorAll('.bg-white');
        expect(skeletonCards).toHaveLength(5);
    });
});
