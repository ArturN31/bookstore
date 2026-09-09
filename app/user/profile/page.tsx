import { getUserData } from '@/data/user/UserService';
import { ErrorState } from '@/components/ui/ErrorState';
import { OnboardingForm } from './components/OnboardingForm/OnboardingForm';
import { QuickActions } from './components/UserProfilePage/QuickActions/QuickActions';
import { UserDetails } from './components/UserProfilePage/UserDetails';

export const dynamic = 'force-dynamic';

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
                <OnboardingForm mode="add" />
            </div>
        );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            <div className="to-gunmetal bg-linear-to-r from-indigo-800 px-4 py-12 sm:px-8 sm:py-16">
                <div className="mx-auto max-w-7xl">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">My Profile</h1>
                    <p className="mt-2 text-indigo-100">
                        Manage your account information and preferences
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="mb-8 overflow-hidden rounded-xl bg-linear-to-br from-indigo-700 to-indigo-800 p-8 text-white shadow-lg">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-indigo-100">Welcome back!</p>
                                <h2 className="text-3xl font-bold">{userData.username}</h2>
                                <div className="h-1 w-12 rounded-full bg-indigo-300" />
                            </div>
                        </div>

                        <QuickActions />
                    </div>

                    <div className="lg:col-span-2">
                        <UserDetails userData={userData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
