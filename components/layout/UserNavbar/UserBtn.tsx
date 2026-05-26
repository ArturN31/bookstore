'use client';

import { useUserActions, useUserState } from '@/providers/user/utils/useUser';
import { usePathname, useRouter } from 'next/navigation';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { CustomPopoverWithList } from '@/components/ui/CustomPopoverWithList';

export const UserBtn = () => {
    const { loggedIn, loading } = useUserState();
    const { signOut } = useUserActions();
    const router = useRouter();
    const pathname = usePathname();

    const handleChoice = (choice: string) => {
        switch (choice) {
            case 'Sign In':
                router.push(`/user/auth/signin?returnTo=${pathname}`);
                break;
            case 'User Profile':
                router.push('/user/profile');
                break;
            case 'Wishlist':
                router.push('/user/wishlist');
                break;
            case 'Sign Out':
                handleSignOut();
                break;
            default:
                router.push('/');
                break;
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            if (pathname.startsWith('/user/')) router.push('/');
            else router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getListData = () => {
        if (loading)
            return {
                labels: ['Loading...'],
                icons: [
                    <div
                        key="load"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
                    />,
                ],
            };

        if (loggedIn)
            return {
                labels: ['User Profile', 'Wishlist', 'Sign Out'],
                icons: [
                    <ManageAccountsIcon key="p" />,
                    <BookmarkAddedOutlinedIcon key="w" />,
                    <LogoutIcon key="s" />,
                ],
            };

        return {
            labels: ['Sign In'],
            icons: [<LoginIcon key="l" />],
        };
    };

    const { labels, icons } = getListData();

    return (
        <CustomPopoverWithList
            btnText=""
            btnIcon={
                <div
                    role="button"
                    aria-label="User account and settings"
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#facc15] text-black shadow-md transition-all ${
                        loading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-[#eab308]'
                    } `}
                >
                    <PersonOutlineOutlinedIcon
                        aria-hidden="true"
                        className={loading ? 'animate-pulse' : ''}
                    />
                </div>
            }
            listToRender={labels}
            listIcons={icons}
            listItemOnClick={loading ? () => {} : handleChoice}
            message={undefined}
        />
    );
};
