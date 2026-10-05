import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SHIPPING_METHODS } from '@/data/checkout/CheckoutConstants';
import { calculateMethodShippingCost } from '@/data/checkout/CheckoutUtils';
import { ShippingMethodSection } from '@/app/checkout/components/ShippingMethodSection';

jest.mock('@/data/checkout/CheckoutConstants', () => ({
    SHIPPING_METHODS: [
        {
            id: 'royal_mail_standard',
            name: 'Royal Mail Standard',
            description: 'Standard delivery',
            estimatedDelivery: '2-3 Days',
            isExpress: false,
            isCollect: false,
            baseCosts: { zone_1: 2.99, zone_2: 4.99, zone_3: 7.99 },
        },
        {
            id: 'courier_express',
            name: 'Courier Express',
            description: 'Express delivery',
            estimatedDelivery: 'Next Day',
            isExpress: true,
            isCollect: false,
            baseCosts: { zone_1: 5.99, zone_2: 8.99, zone_3: 12.99 },
        },
        {
            id: 'click_and_collect',
            name: 'In-Store Collection',
            description: 'Collect from store',
            estimatedDelivery: '2 Hours',
            isExpress: false,
            isCollect: true,
            baseCosts: { zone_1: 0, zone_2: 0, zone_3: 0 },
        },
    ],
}));

jest.mock('@/data/checkout/CheckoutUtils', () => ({
    calculateMethodShippingCost: jest.fn(),
    formatCurrency: jest.fn((amount: number) => `£${amount.toFixed(2)}`),
}));

describe('ShippingMethodSection', () => {
    const mockOnSelectMethod = jest.fn();
    const mockedCalculateMethodShippingCost = jest.mocked(calculateMethodShippingCost);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedCalculateMethodShippingCost.mockImplementation((method) => {
            if (method.id === 'courier_express') return 5.99;
            return 0;
        });
    });

    it('should render all shipping methods with their details and formatted costs', () => {
        render(
            <ShippingMethodSection
                selectedMethodId="royal_mail_standard"
                postcode="G1 1AA"
                subtotalAfterDiscount={60}
                onSelectMethod={mockOnSelectMethod}
            />,
        );

        expect(screen.getByText('Delivery Method & Speed')).toBeInTheDocument();
        expect(screen.getByText('Royal Mail Standard')).toBeInTheDocument();
        expect(screen.getByText('Standard delivery')).toBeInTheDocument();
        expect(screen.getByText('Courier Express')).toBeInTheDocument();
        expect(screen.getByText('In-Store Collection')).toBeInTheDocument();
        expect(screen.getByText('Next Day')).toBeInTheDocument();
        expect(screen.getByText('2 Hours')).toBeInTheDocument();
        expect(screen.getByText('£5.99')).toBeInTheDocument();
        expect(screen.getAllByText('FREE')).toHaveLength(2);
    });

    it('should call onSelectMethod when a different shipping method is selected', () => {
        render(
            <ShippingMethodSection
                selectedMethodId="royal_mail_standard"
                postcode="G1 1AA"
                subtotalAfterDiscount={60}
                onSelectMethod={mockOnSelectMethod}
            />,
        );

        const expressLabel = screen.getByText('Courier Express').closest('label');
        expect(expressLabel).toBeInTheDocument();

        if (expressLabel) {
            fireEvent.click(expressLabel);
            expect(mockOnSelectMethod).toHaveBeenCalledWith('courier_express');
        }
    });

    it('should pass correct arguments to calculateMethodShippingCost for each method', () => {
        render(
            <ShippingMethodSection
                selectedMethodId="royal_mail_standard"
                postcode="EH1 1AA"
                subtotalAfterDiscount={25}
                onSelectMethod={mockOnSelectMethod}
            />,
        );

        expect(mockedCalculateMethodShippingCost).toHaveBeenCalledTimes(SHIPPING_METHODS.length);
        expect(mockedCalculateMethodShippingCost).toHaveBeenCalledWith(
            SHIPPING_METHODS[0],
            25,
            'EH1 1AA',
        );
        expect(mockedCalculateMethodShippingCost).toHaveBeenCalledWith(
            SHIPPING_METHODS[1],
            25,
            'EH1 1AA',
        );
        expect(mockedCalculateMethodShippingCost).toHaveBeenCalledWith(
            SHIPPING_METHODS[2],
            25,
            'EH1 1AA',
        );
    });
});
