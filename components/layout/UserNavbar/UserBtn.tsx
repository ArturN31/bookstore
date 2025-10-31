'use client';

import { CustomPopoverWithList } from '@/components/CustomPopoverWithList';
import { useUserState } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { logout } from '@/data/user/GetUserData';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

export const UserBtn = () => {
	const { loggedIn, toggleLoggedIn, clearUsername } = useUserState();
	const router = useRouter();

	const handleChoice = (choice: string) => {
		switch (choice) {
			case 'Sign In':
				router.push('/user/auth/signin');
				break;
			case 'User Profile':
				router.push('/user/profile');
				break;
			case 'Wishlist':
				router.push('/user/wishlist');
				break;
			case 'Homepage':
				router.push('/');
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
		const res = await logout();

		if (res) {
			toggleLoggedIn(false);
			clearUsername();
			handleChoice('Homepage');
		}
	};

	if (!loggedIn)
		return (
			<CustomPopoverWithList
				btnText=''
				btnIcon={<PersonOutlineOutlinedIcon />}
				listToRender={['Sign In']}
				listIcons={[<LoginIcon />]}
				message={undefined}
				listItemOnClick={handleChoice}
			/>
		);

	if (loggedIn)
		return (
			<CustomPopoverWithList
				btnText=''
				btnIcon={<PersonOutlineOutlinedIcon />}
				listToRender={['User Profile', 'Wishlist', 'Sign Out']}
				listIcons={[
					<ManageAccountsIcon />,
					<BookmarkAddedOutlinedIcon />,
					<LogoutIcon />,
				]}
				message={undefined}
				listItemOnClick={handleChoice}
			/>
		);
};
