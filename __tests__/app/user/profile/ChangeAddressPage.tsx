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
        (getUserData as jest.Mock).mockResolvedValue(null);

        const Page = await ChangeAddressPage();
        render(Page);

        expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should render form when userData is present', async () => {
        (getUserData as jest.Mock).mockResolvedValue({
            first_name: 'Jane',
            street_address: '123 Test St',
        });

        const Page = await ChangeAddressPage();
        render(Page);

        expect(screen.getByTestId('update-address-form')).toHaveTextContent('123 Test St');
        expect(redirect).not.toHaveBeenCalled();
    });
});
