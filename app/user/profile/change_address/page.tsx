import { AddressForm } from '@/components/pages/user/profile/AddressForm/AddressForm';
import { getUserData } from '@/data/user/GetUserData';
import { redirect } from 'next/navigation';

export default async function ChangeAddressPage() {
    const userData = await getUserData();

    if (!userData) {
        redirect('/');
        return null;
    }

    const formattedData = {
        firstName: userData.first_name,
        lastName: userData.last_name,
        dob: userData.date_of_birth,
        streetAddress: userData.street_address,
        postcode: userData.postcode,
        city: userData.city,
        country: userData.country,
        phoneNumber: userData.phone_number,
    };

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <AddressForm
                mode="update"
                initialData={formattedData}
            />
        </div>
    );
}
