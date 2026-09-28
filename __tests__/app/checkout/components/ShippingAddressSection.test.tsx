import { ShippingAddressSection } from '@/app/checkout/components/ShippingAddressSection';
import { render, screen } from '@testing-library/react';

describe('ShippingAddressSection', () => {
    const customerEmail = 'john.doe@example.com';

    it('renders complete shipping address and Change link when profile address is complete', () => {
        const completeProfile = {
            first_name: 'John',
            last_name: 'Doe',
            street_address: '123 High Street',
            city: 'Edinburgh',
            postcode: 'eh1 11a',
            country: 'United Kingdom',
        };

        render(
            <ShippingAddressSection
                customerEmail={customerEmail}
                initialProfile={completeProfile}
            />,
        );

        expect(screen.getByText('Deliver To')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(
            screen.getByText('123 High Street, Edinburgh, EH1 11A, United Kingdom'),
        ).toBeInTheDocument();

        const changeLink = screen.getByRole('link', { name: /change/i });
        expect(changeLink).toBeInTheDocument();
        expect(changeLink).toHaveAttribute(
            'href',
            '/user/profile/change_address?redirectTo=/checkout',
        );
    });

    it('renders incomplete address message and Add Address link when address fields are missing', () => {
        const incompleteProfile = {
            first_name: 'John',
            last_name: '',
            street_address: '',
            city: '',
            postcode: '',
        };

        render(
            <ShippingAddressSection
                customerEmail={customerEmail}
                initialProfile={incompleteProfile}
            />,
        );

        expect(screen.getByText(`Address incomplete (${customerEmail})`)).toBeInTheDocument();

        const addLink = screen.getByRole('link', { name: /add address/i });
        expect(addLink).toBeInTheDocument();
        expect(addLink).toHaveAttribute(
            'href',
            '/user/profile/change_address?redirectTo=/checkout',
        );
    });

    it('uses default country fallback when country is null or omitted', () => {
        const profileWithoutCountry = {
            first_name: 'Jane',
            last_name: 'Smith',
            street_address: '456 Market St',
            city: 'Glasgow',
            postcode: 'g1 2ff',
            country: null,
        };

        render(
            <ShippingAddressSection
                customerEmail={customerEmail}
                initialProfile={profileWithoutCountry}
            />,
        );

        expect(
            screen.getByText('456 Market St, Glasgow, G1 2FF, United Kingdom'),
        ).toBeInTheDocument();
    });

    it('handles null initialProfile gracefully', () => {
        render(
            <ShippingAddressSection
                customerEmail={customerEmail}
                initialProfile={null}
            />,
        );

        expect(screen.getByText(`Address incomplete (${customerEmail})`)).toBeInTheDocument();
    });
});
