import { LiveTelemetry } from '@/app/dev-tools/components/LiveTelemetry/LiveTelemetry';
import { createAdminClient } from '@/utils/db/admin';
import { render, screen } from '@testing-library/react';

jest.mock('@/utils/db/admin', () => ({
    createAdminClient: jest.fn(),
}));

const mockCreateAdminClient = jest.mocked(createAdminClient);

describe('LiveTelemetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and render telemetry data correctly for all configured tables', async () => {
        const mockSelect = jest.fn().mockResolvedValue({ count: 125 });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        mockCreateAdminClient.mockResolvedValue({
            from: mockFrom,
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await LiveTelemetry();
        render(ui);

        expect(screen.getByText('Books')).toBeInTheDocument();
        expect(screen.getByText('Book Reviews')).toBeInTheDocument();
        expect(screen.getByText('Wishlist')).toBeInTheDocument();

        const counts = screen.getAllByText('125');
        expect(counts).toHaveLength(10);
        expect(mockFrom).toHaveBeenCalledTimes(10);
    });

    it('should fallback to 0 when table count is null or undefined', async () => {
        const mockSelect = jest.fn().mockResolvedValue({ count: null });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        mockCreateAdminClient.mockResolvedValue({
            from: mockFrom,
        } as unknown as ReturnType<typeof createAdminClient>);

        const ui = await LiveTelemetry();
        render(ui);

        const zeroCounts = screen.getAllByText('0');
        expect(zeroCounts.length).toBeGreaterThan(0);
    });
});
