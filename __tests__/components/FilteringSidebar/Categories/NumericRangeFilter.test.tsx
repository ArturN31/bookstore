import { render, screen, fireEvent } from '@testing-library/react';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { NumericRangeFilter } from '@/components/FilteringSidebar/Categories/NumericRangeFilter';

jest.mock('@/data/advancedFiltering/useCategoryFilter', () => ({
    useCategoryFilter: jest.fn(),
}));

describe('NumericRangeFilter', () => {
    const mockSetValue = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: [10, 90],
            setValue: mockSetValue,
        });
    });

    it('should render range labels and slider correctly with standard numbers', () => {
        render(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 100]}
            />,
        );

        expect(screen.getAllByText('10')[0]).toBeInTheDocument();
        expect(screen.getAllByText('90')[0]).toBeInTheDocument();
        const sliders = screen.getAllByRole('slider', { hidden: true });
        expect(sliders.length).toBe(2);
    });

    it('should format values as currency when category is PRICES', () => {
        render(
            <NumericRangeFilter
                category="PRICES"
                values={[0, 100]}
            />,
        );

        expect(screen.getAllByText('£10.00')[0]).toBeInTheDocument();
        expect(screen.getAllByText('£90.00')[0]).toBeInTheDocument();
    });

    it('should fall back to 0 and 100 when values array is empty', () => {
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: undefined,
            setValue: mockSetValue,
        });

        render(
            <NumericRangeFilter
                category="PAGES"
                values={[]}
            />,
        );

        expect(screen.getAllByText('0')[0]).toBeInTheDocument();
        expect(screen.getAllByText('100')[0]).toBeInTheDocument();
    });

    it('should call setValue when slider change is committed', () => {
        render(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 100]}
            />,
        );

        const sliders = screen.getAllByRole('slider', { hidden: true });
        fireEvent.change(sliders[0], { target: { value: '20' } });
        fireEvent.change(sliders[1], { target: { value: '80' } });
        fireEvent.mouseUp(sliders[0]);

        expect(mockSetValue).toHaveBeenCalledWith([20, 80]);
    });

    it('should synchronize range when activeFilterRange or values change externally', () => {
        const { rerender } = render(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 100]}
            />,
        );

        expect(screen.getAllByText('10')[0]).toBeInTheDocument();

        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: [30, 70],
            setValue: mockSetValue,
        });

        rerender(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 200]}
            />,
        );

        expect(screen.getAllByText('30')[0]).toBeInTheDocument();
        expect(screen.getAllByText('70')[0]).toBeInTheDocument();
    });

    it('should fall back to min and max during sync when activeFilterRange becomes undefined', () => {
        const { rerender } = render(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 100]}
            />,
        );

        expect(screen.getAllByText('10')[0]).toBeInTheDocument();

        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: undefined,
            setValue: mockSetValue,
        });

        rerender(
            <NumericRangeFilter
                category="PAGES"
                values={[0, 100]}
            />,
        );

        expect(screen.getAllByText('0')[0]).toBeInTheDocument();
        expect(screen.getAllByText('100')[0]).toBeInTheDocument();
    });
});
