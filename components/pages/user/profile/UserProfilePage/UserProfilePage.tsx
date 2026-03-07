import { QuickActions } from '@/components/pages/user/profile/UserProfilePage/QuickActions';
import { UserDetails } from '@/components/pages/user/profile/UserProfilePage/UserDetails';

export const UserProfilePage = ({ userData }: { userData: User }) => {
    return (
        <div className="bg-gray-100 py-10">
            <div className="space-y-8 px-8">
                <div className="flex w-fit flex-col gap-8 place-self-center">
                    <div className="flex gap-8">
                        <div className="flex flex-col justify-center rounded-lg bg-white p-6 shadow-md">
                            <p className="mb-1 text-lg font-semibold text-gray-700">
                                Welcome back,
                            </p>
                            <p className="text-xl font-bold text-indigo-600">
                                {userData.username}!
                            </p>
                        </div>
                        <QuickActions />
                    </div>
                    <UserDetails userData={userData} />
                </div>
            </div>
        </div>
    );
};
