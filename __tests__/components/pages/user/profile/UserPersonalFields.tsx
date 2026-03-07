import { render, screen, fireEvent } from '@testing-library/react';
import { UserAddressFormState } from '@/data/actions/AddressForm/UserAddressAction';
import { UserPersonalFields } from '@/components/pages/user/profile/AddressForm/UserPersonalFields';

describe('APP - pages/user - AddressForm - UserPersonalFields', () => {
    const mockOnChange = jest.fn();

    const baseData: Partial<UserAddressFormState> = {
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
        phoneNumber: '123456789',
    };

    it('renders with provided data (covers truthy branches)', () => {
        render(
            <UserPersonalFields
                formData={baseData as UserAddressFormState}
                onChange={mockOnChange}
            />,
        );

        expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Doe');
        expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('1990-01-01');
        expect(screen.getByLabelText(/Phone/i)).toHaveValue('123456789');
    });

    it('renders with empty strings when data is missing (covers falsy branches)', () => {
        render(
            <UserPersonalFields
                formData={{} as any}
                onChange={mockOnChange}
            />,
        );

        expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');
        expect(screen.getByLabelText(/Date of Birth/i)).toHaveValue('');
        expect(screen.getByLabelText(/Phone/i)).toHaveValue('');
    });

    it('calls onChange when inputs are modified', () => {
        render(
            <UserPersonalFields
                formData={baseData as UserAddressFormState}
                onChange={mockOnChange}
            />,
        );

        const input = screen.getByLabelText(/First Name/i);
        fireEvent.change(input, { target: { value: 'Jane' } });

        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
});
