import { DiscountSection } from '@/app/checkout/components/DiscountSection';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppliedDiscountState } from '@/data/checkout/CheckoutTypes';

describe('DiscountSection', () => {
    const defaultProps = {
        couponInput: '',
        appliedDiscount: null as AppliedDiscountState | null,
        discountError: null as string | null,
        isApplyingDiscount: false,
        onCouponChange: jest.fn(),
        onApplyDiscount: jest.fn(),
        onRemoveDiscount: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders promo input field and apply button when no discount is applied', () => {
        render(
            <DiscountSection
                {...defaultProps}
                couponInput="SAVE10"
            />,
        );

        const input = screen.getByLabelText(/enter promo code/i) as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.value).toBe('SAVE10');

        const applyButton = screen.getByRole('button', { name: /apply/i });
        expect(applyButton).not.toBeDisabled();

        fireEvent.click(applyButton);
        expect(defaultProps.onApplyDiscount).toHaveBeenCalledTimes(1);
    });

    it('triggers onCouponChange when typing in the input field', () => {
        render(<DiscountSection {...defaultProps} />);

        const input = screen.getByLabelText(/enter promo code/i);
        fireEvent.change(input, { target: { value: 'PROMO20' } });

        expect(defaultProps.onCouponChange).toHaveBeenCalledWith('PROMO20');
    });

    it('disables apply button when couponInput is empty or whitespace-only', () => {
        render(
            <DiscountSection
                {...defaultProps}
                couponInput="   "
            />,
        );

        const applyButton = screen.getByRole('button', { name: /apply/i });
        expect(applyButton).toBeDisabled();
    });

    it('displays loading state on button when isApplyingDiscount is true', () => {
        render(
            <DiscountSection
                {...defaultProps}
                couponInput="SAVE10"
                isApplyingDiscount={true}
            />,
        );

        const applyButton = screen.getByRole('button', { name: /applying\.\.\./i });
        expect(applyButton).toBeDisabled();
    });

    it('displays error helper text when discountError is provided', () => {
        render(
            <DiscountSection
                {...defaultProps}
                couponInput="INVALID"
                discountError="Invalid promo code"
            />,
        );

        expect(screen.getByText('Invalid promo code')).toBeInTheDocument();
    });

    it('renders applied discount badge and remove button when discount is applied', () => {
        const appliedDiscount: AppliedDiscountState = {
            id: '123',
            code: 'SAVE10',
            discountAmount: 5.0,
            discountPercent: 10,
            minimumSubtotal: null,
        };

        render(
            <DiscountSection
                {...defaultProps}
                appliedDiscount={appliedDiscount}
            />,
        );

        expect(screen.getByText('SAVE10')).toBeInTheDocument();
        expect(screen.getByText('Discount applied successfully!')).toBeInTheDocument();

        const removeButton = screen.getByRole('button', { name: /remove discount/i });
        expect(removeButton).toBeInTheDocument();

        fireEvent.click(removeButton);
        expect(defaultProps.onRemoveDiscount).toHaveBeenCalledTimes(1);
    });
});
