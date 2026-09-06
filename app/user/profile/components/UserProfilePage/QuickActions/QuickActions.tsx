import { RateReview } from '@mui/icons-material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EditLocationOutlinedIcon from '@mui/icons-material/EditLocationOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { ActionSection } from './ActionSection';
import { ActionLink } from './ActionLink';
import { getUserData } from '@/data/user/UserService';

export const QuickActions = async () => {
    const response = await getUserData();
    const user = response.data;

    return (
        <div className="space-y-6">
            <ActionSection
                title="Change Account Details"
                description="Update your profile information"
            >
                <ActionLink
                    href="/user/profile/change_address"
                    icon={EditLocationOutlinedIcon}
                    label="Change Address"
                    color="green"
                />
            </ActionSection>

            <ActionSection
                title="My Content & History"
                description="View your orders, reviews, and personal activity"
            >
                {user?.username && (
                    <ActionLink
                        href={`/user/${user.username}`}
                        icon={PersonOutlinedIcon}
                        label="My Public Profile"
                        color="blue"
                    />
                )}
                <ActionLink
                    href="/user/content/reviews"
                    icon={RateReview}
                    label="My Book Reviews"
                    color="blue"
                />
            </ActionSection>

            <ActionSection
                title="Security"
                description="Keep your account secure"
            >
                <ActionLink
                    href="/user/auth/change_password"
                    icon={LockPersonOutlinedIcon}
                    label="Change Password"
                    color="orange"
                />
            </ActionSection>

            <ActionSection
                title="Preferences"
                description="Manage your settings"
            >
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                    <SettingsOutlinedIcon className="mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">More preferences coming soon</p>
                </div>
            </ActionSection>

            <ActionSection
                title="Need Help?"
                description="Find answers and support"
            >
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50 p-4">
                    <HelpOutlineOutlinedIcon className="mt-1 shrink-0 text-blue-600" />
                    <div>
                        <p className="font-medium text-gray-800">Contact Support</p>
                        <p className="text-sm text-gray-600">
                            Having issues? Reach out to our support team
                        </p>
                    </div>
                </div>
            </ActionSection>
        </div>
    );
};
