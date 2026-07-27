import { render, screen, fireEvent } from '@testing-library/react';
import { useCategoryFilter } from '@/data/advancedFiltering/useCategoryFilter';
import { DateRangeFilter } from '@/components/FilteringSidebar/Categories/DateRangeFilter';

jest.mock('@/data/advancedFiltering/useCategoryFilter', () => ({
    useCategoryFilter: jest.fn(),
}));

describe('DateRangeFilter', () => {
    const mockSetValue = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: ['2023-01-01', '2023-12-31'],
            setValue: mockSetValue,
        });
    });

    it('should render From and To date inputs with correct values', () => {
        render(
            <DateRangeFilter
                category="PUBLICATIONS"
                values={['2023-01-01', '2023-12-31']}
            />,
        );

        const fromInput = screen.getByLabelText(/from/i);
        const toInput = screen.getByLabelText(/to/i);

        expect(fromInput).toHaveValue('2023-01-01');
        expect(toInput).toHaveValue('2023-12-31');
    });

    it('should fall back to min and max dates when categoryValue is empty or undefined', () => {
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: undefined,
            setValue: mockSetValue,
        });

        render(
            <DateRangeFilter
                category="PUBLICATIONS"
                values={['2023-05-01', '2023-05-15']}
            />,
        );

        const fromInput = screen.getByLabelText(/from/i);
        const toInput = screen.getByLabelText(/to/i);

        expect(fromInput).toHaveValue('2023-05-01');
        expect(toInput).toHaveValue('2023-05-15');
    });

    it('should call setValue with updated start date when From input changes', () => {
        render(
            <DateRangeFilter
                category="PUBLICATIONS"
                values={['2023-01-01', '2023-12-31']}
            />,
        );

        const fromInput = screen.getByLabelText(/from/i);
        fireEvent.change(fromInput, { target: { value: '2023-02-01' } });

        expect(mockSetValue).toHaveBeenCalledWith(['2023-02-01', '2023-12-31']);
    });

    it('should call setValue with updated end date when To input changes', () => {
        render(
            <DateRangeFilter
                category="PUBLICATIONS"
                values={['2023-01-01', '2023-12-31']}
            />,
        );

        const toInput = screen.getByLabelText(/to/i);
        fireEvent.change(toInput, { target: { value: '2023-11-30' } });

        expect(mockSetValue).toHaveBeenCalledWith(['2023-01-01', '2023-11-30']);
    });

    it('should handle invalid values array gracefully', () => {
        (useCategoryFilter as jest.Mock).mockReturnValue({
            categoryValue: undefined,
            setValue: mockSetValue,
        });

        render(
            <DateRangeFilter
                category="PUBLICATIONS"
                values={['invalid-date']}
            />,
        );

        const fromInput = screen.getByLabelText(/from/i);
        const toInput = screen.getByLabelText(/to/i);

        expect(fromInput).toHaveValue('');
        expect(toInput).toHaveValue('');
    });
});
