import { Edit } from '@mui/icons-material';
import EditLocationOutlinedIcon from '@mui/icons-material/EditLocationOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { ActionSection } from './ActionSection';
import { ActionLink } from './ActionLink';

export const QuickActions = () => {
    return (
        <div className="space-y-6">
            <ActionSection
                title="Change Account Details"
                description="Update your profile information"
            >
                <ActionLink
                    href="/user/profile/change_username"
                    icon={Edit}
                    label="Change Username"
                    color="gray"
                />
                <ActionLink
                    href="/user/profile/change_address"
                    icon={EditLocationOutlinedIcon}
                    label="Change Address"
                    color="green"
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
