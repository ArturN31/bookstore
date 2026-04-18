import { AddressForm } from '@/components/pages/user/profile/AddressForm/AddressForm';
import { getUserData } from '@/data/user/GetUserData';
import { redirect } from 'next/navigation';

const sanitize = (value: string | null): string => value ?? '';

const mapUserToAddressForm = (user: User) => ({
    firstName: sanitize(user.first_name),
    lastName: sanitize(user.last_name),
    dob: sanitize(user.date_of_birth),
    streetAddress: sanitize(user.street_address),
    postcode: sanitize(user.postcode),
    city: sanitize(user.city),
    country: sanitize(user.country),
    phoneNumber: sanitize(user.phone_number),
});

export default async function ChangeAddressPage() {
    const { data: userData, error } = await getUserData();

    if (error || !userData) redirect('/');

    const formattedData = mapUserToAddressForm(userData);

    return (
        <div className="relative grid w-full max-w-md place-self-center">
            <AddressForm
                mode="update"
                initialData={formattedData}
            />
        </div>
    );
}
