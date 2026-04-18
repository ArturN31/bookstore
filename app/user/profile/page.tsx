import { getUserData } from '@/data/user/GetUserData';
import { AddressForm } from '@/components/pages/user/profile/AddressForm/AddressForm';
import { UserProfilePage } from '@/components/pages/user/profile/UserProfilePage/UserProfilePage';
import { ErrorState } from '@/components/ui/ErrorState';

export default async function ProfilePage() {
    const { data: userData, error: serverError } = await getUserData();

    if (serverError && serverError !== 'Failed to retrieve profile data.')
        return (
            <ErrorState
                title="Profile Error"
                message={serverError}
            />
        );

    if (!userData)
        return (
            <div
                className="grid gap-5 py-10"
                data-testid="no-user-profile-info"
            >
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Welcome!</h1>
                    <p className="text-gray-600">Please complete your profile to continue.</p>
                </div>
                <AddressForm mode="add" />
            </div>
        );

    return <UserProfilePage userData={userData} />;
}
