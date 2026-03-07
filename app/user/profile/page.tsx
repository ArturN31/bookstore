import { getUserData } from '@/data/user/GetUserData';
import { createBackendClient } from '@/utils/db/server';
import { AddressForm } from '../../../components/pages/user/profile/AddressForm/AddressForm';
import { UserProfilePage } from '../../../components/pages/user/profile/UserProfilePage/UserProfilePage';

export default async function ProfilePage() {
    const supabase = await createBackendClient();
    const userData = await getUserData(supabase);

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
