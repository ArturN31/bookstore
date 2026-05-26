import ChangeAddressPage from '@/app/user/profile/change_address/page';
import { UserAddressFormState } from '@/data/actions/AddressForm/UserAddressAction';
import { getUserData } from '@/data/user/GetUserData';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: UserAddressFormState = {
    streetAddress: '',
    postcode: '',
    city: '',
    country: '',
    validationErrors: undefined,
    message: MOCK_MESSAGE,
    error: undefined,
};

jest.mock('@/data/actions/AddressForm/UserAddressAction', () => ({
    UserAddressAction: jest.fn(async () => mockReturnState),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

jest.mock('@/data/user/GetUserData', () => ({
    getUserData: jest.fn(),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(() => ({})),
}));

jest.mock('@/components/pages/user/profile/AddressForm/AddressForm', () => ({
    AddressForm: jest.fn(({ initialData }) => (
        <div data-testid="update-address-form">{initialData?.streetAddress}</div>
    )),
}));

describe('APP - Auth - ChangeAddressPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should redirect to homepage when userData is not retrieved', async () => {
        (getUserData as jest.Mock).mockResolvedValue({ data: null, error: null });

        try {
            await ChangeAddressPage();
        } catch (e) {
            // Redirect throws in test environment
        }

        expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to homepage when there is an error', async () => {
        (getUserData as jest.Mock).mockResolvedValue({ data: null, error: 'Error' });

        try {
            await ChangeAddressPage();
        } catch (e) {
            // Redirect throws in test environment
        }

        expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should render form when userData is present', async () => {
        (getUserData as jest.Mock).mockResolvedValue({
            data: {
                first_name: 'Jane',
                last_name: null,
                date_of_birth: null,
                street_address: '123 Test St',
                postcode: null,
                city: null,
                country: null,
                phone_number: null,
            },
            error: null,
        });

        const Page = await ChangeAddressPage();
        render(Page);

        expect(screen.getByTestId('update-address-form')).toHaveTextContent('123 Test St');
        expect(redirect).not.toHaveBeenCalled();
    });
});
