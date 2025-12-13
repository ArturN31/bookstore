import ChangeAddressPage from '@/app/user/profile/change_address/page';
import { ChangeAddressFormState } from '@/data/actions/AddressForm/ChangeAddressAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: ChangeAddressFormState = {
	streetAddress: '',
	postcode: '',
	city: '',
	country: '',
	validationErrors: undefined,
	message: MOCK_MESSAGE,
	error: undefined,
};

jest.mock('@/data/actions/AddressForm/ChangeAddressAction', () => ({
	ChangeAddressAction: jest.fn(async (prevState, formData) => {
		const reset = formData.get('reset');
		if (reset === 'yes') {
			return {
				streetAddress: '',
				postcode: '',
				city: '',
				country: '',
				validationErrors: undefined,
				message: undefined,
				error: undefined,
			};
		}
		return mockReturnState;
	}),
}));

jest.mock('react', () => {
	const originalReact = jest.requireActual('react');

	return {
		...originalReact,
		useActionState: (actionFn: any, initialState: any) => {
			const [state, setState] = originalReact.useState(initialState);

			const formAction = async (formData: FormData) => {
				const newState = await actionFn(state, formData);
				setState(newState);
			};

			return [state, formAction];
		},
		useTransition: () => [false, (callback: any) => callback()],
	};
});

describe('APP - Auth - ChangeAddressPage', () => {
	it('should set formError state and display message when the form action returns a message', async () => {
		render(<ChangeAddressPage />);

		const streetAddressField = screen.getByTestId('streetAddress-field');
		const postcodeField = screen.getByTestId('postcode-field');
		const cityField = screen.getByTestId('city-field');
		const countryField = screen.getByTestId('country-field');

		fireEvent.change(streetAddressField, { target: { value: 'validAddress' } });
		fireEvent.change(postcodeField, { target: { value: 'invalidPostcode' } });
		fireEvent.change(cityField, { target: { value: 'validCity' } });
		fireEvent.change(countryField, { target: { value: 'validCountry' } });

		const changeAddressForm = screen.getByTestId('change-address-form');
		fireEvent.submit(changeAddressForm);

		await waitFor(() => {
			const errorDisplay = screen.getByTestId('form-error-display');
			expect(errorDisplay).toBeInTheDocument();
			expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
		});
	});

	it('should reset the formState to Default on resetBtn click', async () => {
		render(<ChangeAddressPage />);

		const streetAddressField = screen.getByTestId(
			'streetAddress-field',
		) as HTMLInputElement;
		const postcodeField = screen.getByTestId('postcode-field') as HTMLInputElement;
		const cityField = screen.getByTestId('city-field') as HTMLInputElement;
		const countryField = screen.getByTestId('country-field') as HTMLInputElement;

		fireEvent.change(streetAddressField, { target: { value: 'validAddress' } });
		fireEvent.change(postcodeField, { target: { value: 'invalidPostcode' } });
		fireEvent.change(cityField, { target: { value: 'validCity' } });
		fireEvent.change(countryField, { target: { value: 'validCountry' } });

		const resetBtn = screen.getByTestId('reset-btn');
		fireEvent.click(resetBtn);

		await waitFor(() => {
			expect(streetAddressField.value).toBe('');
			expect(postcodeField.value).toBe('');
			expect(cityField.value).toBe('');
			expect(countryField.value).toBe('');
		});
	});

	it('should fall back to empty string when password state is null', async () => {
		mockReturnState = {
			streetAddress: null,
			postcode: null,
			city: null,
			country: null,
			validationErrors: undefined,
			message: MOCK_MESSAGE,
			error: undefined,
		} as any;

		render(<ChangeAddressPage />);

		const changeAddressForm = screen.getByTestId('change-address-form');
		fireEvent.submit(changeAddressForm);

		await waitFor(() => {
			const streetAddressField = screen.getByTestId(
				'streetAddress-field',
			) as HTMLInputElement;
			const postcodeField = screen.getByTestId('postcode-field') as HTMLInputElement;
			const cityField = screen.getByTestId('city-field') as HTMLInputElement;
			const countryField = screen.getByTestId('country-field') as HTMLInputElement;

			expect(streetAddressField.defaultValue).toBe('');
			expect(postcodeField.defaultValue).toBe('');
			expect(cityField.defaultValue).toBe('');
			expect(countryField.defaultValue).toBe('');

			expect(streetAddressField.value).toBe('');
			expect(postcodeField.value).toBe('');
			expect(cityField.value).toBe('');
			expect(countryField.value).toBe('');
		});
	});
});
