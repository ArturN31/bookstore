import { usePathname, useRouter } from 'next/navigation';
import { RefObject } from 'react';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { logout } from '@/data/user/GetUserData';

export const Dropdown = ({
	dropdownRef,
	loggedIn,
}: {
	dropdownRef: RefObject<HTMLDivElement | null>;
	loggedIn: boolean;
}) => {
	const pathname = usePathname();
	const router = useRouter();

	const handleNavigation = (path: string) => {
		router.push(path);
	};

	const handleSignOut = async () => {
		const res = await logout();
		res && handleNavigation('/');
	};

	const activeRoute = 'bg-slate-100 font-semibold';

	return (
		<div
			className='my-2 p-1 bg-white border border-black text-center absolute w-[175px] lg:translate-x-[-150px] translate-x-[-150px] sm:translate-x-[-76px] rounded-md z-40'
			ref={dropdownRef}
			tabIndex={-1}>
			{loggedIn ? (
				<>
					{[
						{
							pathname: '/user/profile',
							fn: () => handleNavigation('/user/profile'),
							icon: <ManageAccountsOutlinedIcon />,
							text: 'User Profile',
						},
						{
							pathname: '/user/wishlist',
							fn: () => handleNavigation('/user/wishlist'),
							icon: <BookmarkAddedOutlinedIcon />,
							text: 'Wishlist',
						},
						{
							pathname: '',
							fn: () => handleSignOut(),
							icon: <LogoutIcon />,
							text: 'Sign Out',
						},
					].map((el) => (
						<button
							key={el.text}
							className={`w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm ${
								pathname === el.pathname ? activeRoute : ''
							}`}
							onClick={el.fn}>
							<div className='flex'>
								<p className='grow'>{el.text}</p>
								{el.icon}
							</div>
						</button>
					))}
				</>
			) : (
				<button
					className={`w-full hover:bg-slate-200 hover:cursor-pointer hover:font-semibold hover:rounded-sm ${
						pathname === '/user/auth/signin' ? activeRoute : ''
					}`}
					onClick={() => {
						handleNavigation('/user/auth/signin');
					}}>
					<div className='flex'>
						<p className='grow'>Sign In</p>
						<LoginIcon />
					</div>
				</button>
			)}
		</div>
	);
};
