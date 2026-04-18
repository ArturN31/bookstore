import { AddressForm } from '@/components/pages/user/profile/AddressForm/AddressForm';
import { UserAddressAction } from '@/data/actions/AddressForm/UserAddressAction';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('@/data/actions/AddressForm/UserAddressAction', () => ({
    UserAddressAction: jest.fn(),
}));

const mockAction = UserAddressAction as jest.Mock;

describe('APP - pages/user - AddressForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('"add" mode branches and nullish coalescing fallbacks', () => {
        render(
            <AddressForm
                mode="add"
                initialData={{}}
            />,
        );

        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
        expect(firstNameInput.value).toBe('');
    });

    it('"update" mode branches and hides user-specific fields', () => {
        render(
            <AddressForm
                mode="update"
                initialData={{ city: 'London' }}
            />,
        );

        expect(screen.getByText('Update Address')).toBeInTheDocument();
        expect(screen.queryByLabelText(/First Name/i)).not.toBeInTheDocument();

        const cityInput = screen.getByLabelText(/City/i) as HTMLInputElement;
        expect(cityInput.value).toBe('London');
    });

    it('handleFieldChange validation branches', async () => {
        render(<AddressForm mode="update" />);
        const cityInput = screen.getByLabelText(/City/i);

        await act(async () => {
            fireEvent.change(cityInput, { target: { name: 'city', value: 'A' } });
        });

        const errorHeaders = screen.getAllByText(/Validation Issues:/i);
        expect(errorHeaders.length).toBeGreaterThan(0);
        expect(screen.getByText(/City name must be at least 2 characters/i)).toBeInTheDocument();

        await act(async () => {
            fireEvent.change(cityInput, { target: { name: 'city', value: 'Glasgow' } });
        });
        expect(
            screen.queryByText(/City name must be at least 2 characters/i),
        ).not.toBeInTheDocument();
    });

    it('handleSubmit early return and successful submission loop', async () => {
        const mockResult = { message: 'Address Saved!', validationErrors: [] };
        mockAction.mockResolvedValue(mockResult);

        render(
            <AddressForm
                mode="update"
                initialData={{
                    streetAddress: '123 Test St',
                    postcode: 'G1 1AA',
                    city: 'Glasgow',
                    country: 'UK',
                }}
            />,
        );

        const submitBtn = screen.getByRole('button', { name: /submit/i });
        const streetInput = screen.getByLabelText(/Street Address/i);

        await act(async () => {
            fireEvent.change(streetInput, { target: { name: 'streetAddress', value: '' } });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(screen.getAllByText(/Validation Issues:/i).length).toBeGreaterThan(0);

        await act(async () => {
            fireEvent.change(streetInput, {
                target: { name: 'streetAddress', value: '123 Valid Street' },
            });
        });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(mockAction).toHaveBeenCalled();
        const successMsg = await screen.findByText(/Address Saved!/i);
        expect(successMsg).toBeInTheDocument();
    });

    it('failing Zod validation', async () => {
        render(
            <AddressForm
                mode="update"
                initialData={{
                    streetAddress: '123 Valid St',
                    postcode: 'G1 1AA',
                    city: 'A',
                    country: 'UK',
                }}
            />,
        );

        const form = document.getElementById('update-address-form') as HTMLFormElement;

        await act(async () => {
            fireEvent.submit(form);
        });

        expect(
            await screen.findByText(/Please fix the errors before submitting/i),
        ).toBeInTheDocument();
        expect(mockAction).not.toHaveBeenCalled();
    });

    it('handleReset and transition block', async () => {
        render(<AddressForm mode="add" />);
        const clearBtn = screen.getByRole('button', { name: /clear/i });

        await act(async () => {
            fireEvent.click(clearBtn);
        });

        expect(mockAction).toHaveBeenCalled();
        const sentData = mockAction.mock.calls[0][2] as FormData;
        expect(sentData.get('reset')).toBe('yes');

        const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
        expect(firstNameInput.value).toBe('');
    });

    it('exhaustively covers lines 138-156 by exercising every "add" mode field', async () => {
        render(<AddressForm mode="add" />);

        const addModeFields = [
            { label: /First Name/i, name: 'firstName', value: 'John' },
            { label: /Last Name/i, name: 'lastName', value: 'Doe' },
            { label: /Phone/i, name: 'phoneNumber', value: '07123456789' },
            { label: /Date of Birth/i, name: 'dob', value: '1990-01-01' },
        ];

        for (const field of addModeFields) {
            const input = screen.getByLabelText(field.label);
            await act(async () => {
                fireEvent.change(input, { target: { name: field.name, value: field.value } });
            });
            expect((input as HTMLInputElement).value).toBe(field.value);
        }

        const firstNameInput = screen.getByLabelText(/First Name/i);
        await act(async () => {
            fireEvent.change(firstNameInput, { target: { name: 'firstName', value: 'J' } });
        });

        const errorTitles = screen.getAllByText(/Validation Issues:/i);
        expect(errorTitles.length).toBeGreaterThan(0);

        expect(screen.getByText(/First name must be at least 2 characters/i)).toBeInTheDocument();
    });

    it('covers the case where validationErrors is undefined (line 138)', () => {
        const dataWithMissingKey = {
            streetAddress: '123 St',
            postcode: 'G1 1AA',
            city: 'Glasgow',
            country: 'UK',
            message: 'Force coverage',
        };

        render(
            <AddressForm
                mode="update"
                initialData={dataWithMissingKey as any}
            />,
        );

        expect(screen.queryByText(/Validation Issues/i)).not.toBeInTheDocument();
    });

    it('satisfying both sides of the validation and add-mode branches', () => {
        const fullInitialData = {
            firstName: 'John',
            lastName: 'Doe',
            dob: '1990-01-01',
            phoneNumber: '0123456789',
        };

        render(
            <AddressForm
                mode="add"
                initialData={fullInitialData}
            />,
        );

        expect(screen.getByLabelText(/First Name/i)).toHaveValue('John');
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Doe');
        expect(screen.queryByText(/Validation Issues/i)).not.toBeInTheDocument();
    });

    it('covers nullish coalescing branches in JSX (?? "")', async () => {
        mockAction.mockResolvedValueOnce({
            streetAddress: undefined,
            postcode: undefined,
            city: undefined,
            country: undefined,
            message: 'Partial update',
            validationErrors: [],
        });

        render(
            <AddressForm
                mode="update"
                initialData={{
                    streetAddress: undefined,
                    postcode: undefined,
                    city: undefined,
                    country: undefined,
                }}
            />,
        );

        const cityInput = screen.getByLabelText(/City/i) as HTMLInputElement;
        expect(cityInput.value).toBe('');
    });

    it('covers nullish coalescing branches in JSX when values are defined (?? "" false branch)', async () => {
        mockAction.mockResolvedValueOnce({
            streetAddress: '123 Main St',
            postcode: '12345',
            city: 'New York',
            country: 'USA',
            message: null,
            validationErrors: [],
        });

        render(
            <AddressForm
                mode="update"
                initialData={{
                    streetAddress: '123 Main St',
                    postcode: '12345',
                    city: 'New York',
                    country: 'USA',
                }}
            />,
        );

        const cityInput = screen.getByLabelText(/City/i) as HTMLInputElement;
        expect(cityInput.value).toBe('New York');
        
        const streetInput = screen.getByLabelText(/Street Address/i) as HTMLInputElement;
        expect(streetInput.value).toBe('123 Main St');
    });
});
